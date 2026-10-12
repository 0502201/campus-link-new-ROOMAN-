import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { db } from './src/db';
import { mongoDb, initMongoDB, getMongoStatus } from './src/db/mongodb';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';

interface AIKeyPoolItem {
  key: string;
  client: GoogleGenAI;
  label: string;
}

let keyPool: AIKeyPoolItem[] = [];
let activeKeyIndex = 0;

function getKeyPool(): AIKeyPoolItem[] {
  if (keyPool.length > 0) return keyPool;

  const rawKeys: { key: string; label: string }[] = [];
  if (process.env.GEMINI_API_KEY) {
    rawKeys.push({ key: process.env.GEMINI_API_KEY.trim(), label: 'Primary Key (GEMINI_API_KEY)' });
  }
  if (process.env.GEMINI_API_KEY_BACKUP) {
    rawKeys.push({ key: process.env.GEMINI_API_KEY_BACKUP.trim(), label: 'Secondary Backup Key (GEMINI_API_KEY_BACKUP)' });
  }
  if (process.env.GEMINI_API_KEY_2) {
    rawKeys.push({ key: process.env.GEMINI_API_KEY_2.trim(), label: 'Backup Key 2 (GEMINI_API_KEY_2)' });
  }
  if (process.env.GEMINI_API_KEYS) {
    process.env.GEMINI_API_KEYS.split(',').forEach((k, idx) => {
      rawKeys.push({ key: k.trim(), label: `Pool Key #${idx + 1}` });
    });
  }

  // Deduplicate and filter out placeholders
  const seen = new Set<string>();
  for (const item of rawKeys) {
    if (item.key && item.key !== 'MY_GEMINI_API_KEY' && !seen.has(item.key)) {
      seen.add(item.key);
      keyPool.push({
        key: item.key,
        label: item.label,
        client: new GoogleGenAI({ apiKey: item.key })
      });
    }
  }

  return keyPool;
}

function isQuotaExhaustedError(error: any): boolean {
  const msg = (error?.message || String(error)).toLowerCase();
  const status = error?.status || error?.statusCode || 0;
  return (
    status === 429 ||
    status === 403 ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('exhausted') ||
    msg.includes('too many requests')
  );
}

async function generateContentWithFailover(options: {
  contents: string;
  config?: any;
  model?: string;
}): Promise<any> {
  const pool = getKeyPool();
  if (pool.length === 0) {
    throw new Error('No valid GEMINI_API_KEY configured in environment');
  }

  const modelCandidates = [
    options.model || GEMINI_MODEL,
    'gemini-flash-lite-latest',
    'gemini-flash-latest',
    'gemini-2.5-flash'
  ].filter((m, idx, arr) => arr.indexOf(m) === idx);

  let lastError: any = null;
  const totalKeys = pool.length;

  for (const modelToTry of modelCandidates) {
    for (let attempt = 0; attempt < totalKeys; attempt++) {
      const currentIndex = (activeKeyIndex + attempt) % totalKeys;
      const currentItem = pool[currentIndex];

      try {
        const response = await currentItem.client.models.generateContent({
          model: modelToTry,
          contents: options.contents,
          config: options.config,
        });

        if (currentIndex !== activeKeyIndex) {
          console.log(`[AI Pool]: Now operating on ${currentItem.label} (${modelToTry})`);
          activeKeyIndex = currentIndex;
        }

        return response;
      } catch (err: any) {
        lastError = err;
        if (isQuotaExhaustedError(err)) {
          if (totalKeys > 1 && attempt < totalKeys - 1) {
            const nextIndex = (currentIndex + 1) % totalKeys;
            console.warn(
              `⚠️ [AI Quota Failover]: ${currentItem.label} on ${modelToTry} quota reached. Failing over to ${pool[nextIndex].label}...`
            );
            continue;
          }
          console.warn(`⚠️ [AI Model Failover]: Quota exhausted on ${modelToTry}, trying fallback model...`);
          break; // Try next model candidate
        }
        throw err;
      }
    }
  }

  throw lastError;
}

function handleAIError(res: express.Response, error: any, endpointName: string) {
  console.error(`[AI Error in ${endpointName}]:`, error);
  let statusCode = 500;
  let message = error?.message || `${endpointName} request failed`;

  if (typeof message === 'string') {
    try {
      const jsonStart = message.indexOf('{');
      if (jsonStart !== -1) {
        const parsed = JSON.parse(message.slice(jsonStart));
        if (parsed.error) {
          statusCode = parsed.error.code || 500;
          message = parsed.error.message || message;
        }
      }
    } catch (_) {}
  }

  if (error?.status && typeof error.status === 'number' && error.status >= 400 && error.status < 600) {
    statusCode = error.status;
  } else if (error?.statusCode && typeof error.statusCode === 'number' && error.statusCode >= 400 && error.statusCode < 600) {
    statusCode = error.statusCode;
  }

  return res.status(statusCode).json({
    error: message,
    httpStatus: statusCode,
    endpoint: endpointName,
    details: error?.message || String(error)
  });
}

// Health check endpoint with MongoDB status
app.get('/api/health', (req, res) => {
  const mongoStatus = getMongoStatus();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiEnabled: getKeyPool().length > 0,
    aiPool: {
      totalKeysConfigured: getKeyPool().length,
      activeKey: getKeyPool()[activeKeyIndex % (getKeyPool().length || 1)]?.label || 'None',
      hasBackup: getKeyPool().length > 1
    },
    database: {
      engine: 'MongoDB Atlas (Mongoose ODM)',
      status: mongoStatus.connected ? 'Connected' : (mongoStatus.uriConfigured ? 'Connecting / Error' : 'Ready (Pending MONGODB_URI)'),
      mongoStatus,
      fallbackStore: 'Local Persistent Store (Active & Synced)',
    }
  });
});

// MongoDB connection status & live configuration test endpoint
app.get('/api/mongodb/status', (req, res) => {
  res.json({ success: true, ...getMongoStatus() });
});

app.post('/api/mongodb/connect', async (req, res) => {
  const { uri } = req.body;
  if (uri && typeof uri === 'string') {
    process.env.MONGODB_URI = uri.trim();
    await initMongoDB();
    return res.json({ success: true, ...getMongoStatus() });
  }
  res.status(400).json({ error: 'Valid MongoDB URI string is required' });
});


// -------------------------------------------------------------
// RESTFUL DATABASE API ROUTES (Full CRUD & Real-Time Sync)
// -------------------------------------------------------------

// Complete state snapshot
app.get('/api/db/state', async (req, res) => {
  try {
    const state = await mongoDb.getState();
    res.json(state);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch database state' });
  }
});

app.post('/api/db/reset', async (req, res) => {
  try {
    const reset = await mongoDb.resetDefaults();
    res.json({ success: true, message: 'Database reset to initial calibrated records', state: reset });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to reset database' });
  }
});

// 1. STUDENTS
app.get('/api/students', async (req, res) => {
  try {
    const { branch, tier, status, query } = req.query;
    const students = await mongoDb.students.findMany({ branch, tier, status, query });
    res.json({ success: true, count: students.length, students });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch students' });
  }
});

app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await mongoDb.students.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json({ success: true, student });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch student' });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const student = req.body;
    if (!student.id) student.id = `std-${Date.now()}`;
    if (!student.name || !student.usn) {
      return res.status(400).json({ error: 'Name and USN are required' });
    }
    const created = await mongoDb.students.create(student);
    res.status(201).json({ success: true, student: created });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create student' });
  }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const updated = await mongoDb.students.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Student not found' });
    res.json({ success: true, student: updated });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update student' });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    const ok = await mongoDb.students.delete(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Student not found' });
    res.json({ success: true, message: 'Student removed successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete student' });
  }
});

// 2. RECRUITER DRIVES
app.get('/api/drives', async (req, res) => {
  try {
    const drives = await mongoDb.drives.findMany();
    res.json({ success: true, drives });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch drives' });
  }
});

app.get('/api/drives/:id', async (req, res) => {
  try {
    const drive = await mongoDb.drives.findById(req.params.id);
    if (!drive) return res.status(404).json({ error: 'Drive not found' });
    res.json({ success: true, drive });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch drive' });
  }
});

app.post('/api/drives', async (req, res) => {
  try {
    const drive = req.body;
    if (!drive.id) drive.id = `drv-${Date.now()}`;
    if (!drive.companyName || !drive.roleTitle) {
      return res.status(400).json({ error: 'Company Name and Role Title are required' });
    }
    const created = await mongoDb.drives.create(drive);
    res.status(201).json({ success: true, drive: created });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create drive' });
  }
});

app.put('/api/drives/:id', async (req, res) => {
  try {
    const updated = await mongoDb.drives.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Drive not found' });
    res.json({ success: true, drive: updated });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update drive' });
  }
});

app.delete('/api/drives/:id', async (req, res) => {
  try {
    const ok = await mongoDb.drives.delete(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Drive not found' });
    res.json({ success: true, message: 'Drive deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete drive' });
  }
});

// 3. PLACEMENT PRE-TALKS (PPT)
app.get('/api/pre-talks', async (req, res) => {
  try {
    const preTalks = await mongoDb.preTalks.findMany();
    res.json({ success: true, preTalks });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch pre-talks' });
  }
});

app.post('/api/pre-talks', async (req, res) => {
  try {
    const talk = req.body;
    if (!talk.id) talk.id = `ppt-${Date.now()}`;
    const created = await mongoDb.preTalks.create(talk);
    res.status(201).json({ success: true, talk: created });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create pre-talk' });
  }
});

app.post('/api/pre-talks/:id/rsvp', async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: 'studentId required' });
    const updated = await mongoDb.preTalks.toggleRsvp(req.params.id, studentId);
    if (!updated) return res.status(404).json({ error: 'Pre-talk not found' });
    res.json({ success: true, talk: updated });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update RSVP' });
  }
});

// 4. DRIVE SCHEDULER & CONFLICTS
app.get('/api/scheduler/slots', async (req, res) => {
  try {
    const slots = await mongoDb.slots.findMany();
    const conflicts = await mongoDb.conflicts.findMany();
    res.json({ success: true, slots, conflicts });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch schedule slots' });
  }
});

app.post('/api/scheduler/slots', async (req, res) => {
  try {
    const slot = req.body;
    if (!slot.id) slot.id = `slot-${Date.now()}`;
    const created = await mongoDb.slots.create(slot);
    const conflicts = await mongoDb.conflicts.findMany();
    res.status(201).json({ success: true, slot: created, conflicts });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create schedule slot' });
  }
});

app.post('/api/scheduler/conflicts/:id/resolve', async (req, res) => {
  try {
    const ok = await mongoDb.slots.resolveConflict(req.params.id);
    const conflicts = await mongoDb.conflicts.findMany();
    res.json({ success: ok, conflicts });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to resolve conflict' });
  }
});

// 5. OFFERS & DOCUMENTATION
app.get('/api/offers', async (req, res) => {
  try {
    const offers = await mongoDb.offers.findMany();
    res.json({ success: true, offers });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch offers' });
  }
});

app.post('/api/offers', async (req, res) => {
  try {
    const offer = req.body;
    if (!offer.id) offer.id = `off-${Date.now()}`;
    const created = await mongoDb.offers.create(offer);
    res.status(201).json({ success: true, offer: created });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create offer' });
  }
});

app.patch('/api/offers/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await mongoDb.offers.updateStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ error: 'Offer not found' });
    res.json({ success: true, offer: updated });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update offer status' });
  }
});

app.patch('/api/offers/:id/verify-document', async (req, res) => {
  try {
    const { docIndex, verified } = req.body;
    const updated = await mongoDb.offers.verifyDoc(req.params.id, docIndex, verified);
    if (!updated) return res.status(404).json({ error: 'Offer or document index not found' });
    res.json({ success: true, offer: updated });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to verify document' });
  }
});

// 6. NOTIFICATIONS & BROADCASTS
app.get('/api/notifications', async (req, res) => {
  try {
    const notifications = await mongoDb.notifications.findMany();
    res.json({ success: true, notifications });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch notifications' });
  }
});

app.post('/api/notifications', async (req, res) => {
  try {
    const notif = req.body;
    if (!notif.id) notif.id = `ntf-${Date.now()}`;
    if (!notif.sentAt) notif.sentAt = new Date().toISOString();
    const created = await mongoDb.notifications.create(notif);
    res.status(201).json({ success: true, notification: created });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create notification' });
  }
});

// 7. REAL-TIME STATS & CONVERSION KPIS
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await mongoDb.stats.get();
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch stats' });
  }
});


// ============================================================================
// 100% REAL GEMINI AI INTEGRATIONS (NO MOCKS, STRICT REAL-TIME GENERATIVE AI)
// ============================================================================

// Helper to ensure AI client is ready with auto-failover
function ensureAI(res: express.Response) {
  const pool = getKeyPool();
  if (pool.length === 0) {
    res.status(401).json({
      error: 'GEMINI_API_KEY is not configured or invalid in your .env file.',
      httpStatus: 401,
      code: 'API_KEY_MISSING'
    });
    return null;
  }
  return {
    models: {
      generateContent: async (args: { contents: string; config?: any; model?: string }) => {
        return generateContentWithFailover(args);
      }
    }
  };
}

// Endpoint 1: Analyze Job Description & Extract Structured Hiring Spec
app.post('/api/gemini/analyze-jd', async (req, res) => {
  const ai = ensureAI(res);
  if (!ai) return;

  try {
    const { jdText, companyName } = req.body;
    if (!jdText) {
      return res.status(400).json({ error: 'Job description text is required', httpStatus: 400 });
    }

    const prompt = `You are CAMPUSLINK AI Placement Assistant for Rooman Technologies.
Analyze the following corporate Job Description (JD) for ${companyName || 'the recruiter'}.
Extract a structured, rigorous assessment specification in JSON format.

Job Description:
"""
${jdText}
"""

Return ONLY a valid JSON object matching this schema:
{
  "roleTitle": string,
  "minCGPA": number,
  "eligibleBranches": string[],
  "maxBacklogsAllowed": number,
  "ctcLPA": number,
  "stipendMonthly": number,
  "jobType": "Full-Time" | "Internship + PPO" | "Apprenticeship",
  "requiredSkills": string[],
  "preferredSkills": string[],
  "keyResponsibilities": string[],
  "selectionRounds": string[],
  "suggestedTechnicalInterviewTopics": string[],
  "screeningAdviceForTPO": string
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, analysis: parsed });
  } catch (error: any) {
    return handleAIError(res, error, '/api/gemini/analyze-jd');
  }
});

// Endpoint 2: Explainable Candidate-Job Fit Matching
app.post('/api/gemini/match-candidate', async (req, res) => {
  const ai = ensureAI(res);
  if (!ai) return;

  try {
    const { student, drive } = req.body;
    if (!student || !drive) {
      return res.status(400).json({ error: 'Student profile and drive details are required', httpStatus: 400 });
    }

    const prompt = `You are CAMPUSLINK AI Recommendation & Matching Engine for Rooman Technologies.
Evaluate the candidate match against the recruiter requirements with transparent explainability.

Candidate Profile:
Name: ${student.name} (${student.usn})
Branch: ${student.branch} | CGPA: ${student.cgpa}
Active Backlogs: ${student.activeBacklogs} | History of Backlogs: ${student.historyOfBacklogs}
Readiness Score: ${student.readinessScore}/100
LeetCode Solved: ${student.leetcodeSolved} | Projects: ${student.projectsCount}
Skills: ${JSON.stringify(student.skills?.map((s: any) => `${s.name} (Lv ${s.level})`) || [])}
Top Projects: ${JSON.stringify(student.topProjects || [])}
Mock Interview Score: ${student.mockInterviewScore} | Aptitude Score: ${student.aptitudeScore}

Recruiter Requirements (${drive.companyName} - ${drive.roleTitle}):
Min CGPA: ${drive.minCGPA} | Max Backlogs: ${drive.maxBacklogsAllowed}
Eligible Branches: ${JSON.stringify(drive.eligibleBranches)}
Required Skills: ${JSON.stringify(drive.requiredSkills)}
Preferred Skills: ${JSON.stringify(drive.preferredSkills || [])}

Calculate multi-dimensional fit scores (0-100), identify matched & missing skills, and provide an explainable decision verdict.

Return ONLY a JSON object matching this schema:
{
  "overallFitScore": number,
  "academicScore": number,
  "technicalScore": number,
  "projectScore": number,
  "assessmentScore": number,
  "isEligible": boolean,
  "ineligibilityReason": string or null,
  "matchedSkills": string[],
  "missingSkills": string[],
  "strengths": string[],
  "explainabilityVerdict": string,
  "improvementTip": string,
  "suggestedInterviewQuestions": string[]
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, match: parsed });
  } catch (error: any) {
    return handleAIError(res, error, '/api/gemini/match-candidate');
  }
});

// Endpoint 3: Personalized Skill Gap Advisor & 4-Week Intervention Plan
app.post('/api/gemini/skill-gap-advisor', async (req, res) => {
  const ai = ensureAI(res);
  if (!ai) return;

  try {
    const { student, targetDomain } = req.body;
    if (!student) {
      return res.status(400).json({ error: 'Student data is required', httpStatus: 400 });
    }

    const prompt = `You are CAMPUSLINK AI Career Coach at Rooman Technologies.
Analyze this student's placement readiness gaps and generate an actionable 4-week remedial intervention roadmap.

Student Profile:
Name: ${student.name} | Branch: ${student.branch} | CGPA: ${student.cgpa}
Readiness Tier: ${student.tier} | Readiness Score: ${student.readinessScore}/100
Backlogs: ${student.activeBacklogs} active
Current Skills: ${JSON.stringify(student.skills)}
Target Corporate Domain: ${targetDomain || 'Tier-1 Product & Cloud Engineering Roles'}
Risk Factors: ${JSON.stringify(student.riskReasons || [])}

Generate a structured intervention plan in JSON format:
{
  "summaryVerdict": string,
  "criticalGaps": string[],
  "fourWeekActionPlan": [
    { "week": number, "focus": string, "tasks": string[], "deliverable": string }
  ],
  "recommendedCertifications": string[],
  "mentorInterventionPriority": "Urgent" | "Moderate" | "Monitoring"
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, plan: parsed });
  } catch (error: any) {
    return handleAIError(res, error, '/api/gemini/skill-gap-advisor');
  }
});

// Endpoint 4: Conflict-Aware Drive Schedule Resolver
app.post('/api/gemini/resolve-schedule-conflict', async (req, res) => {
  const ai = ensureAI(res);
  if (!ai) return;

  try {
    const { conflict, availableSlots, venues } = req.body;

    const prompt = `You are CAMPUSLINK AI Drive Scheduling Optimizer for Rooman Technologies.
Resolve this placement drive conflict:
Conflict Details: ${JSON.stringify(conflict)}
Venues & Labs: ${JSON.stringify(venues || ['Computer Lab 1 (120 seats)', 'Computer Lab 2 (100 seats)', 'Computer Lab 3 (80 seats)', 'Main Auditorium', 'Placement Suites'])}
Available Windows: ${JSON.stringify(availableSlots || ['Morning 09:00 - 12:00', 'Afternoon 13:30 - 16:30', 'Evening 17:00 - 19:30'])}

Provide a conflict-free resolution plan in JSON:
{
  "rootCauseAnalysis": string,
  "recommendedAction": string,
  "alternativeVenues": string[],
  "suggestedTimeSlot": string,
  "studentNotificationNote": string,
  "contingencyPlan": string
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, resolution: parsed });
  } catch (error: any) {
    return handleAIError(res, error, '/api/gemini/resolve-schedule-conflict');
  }
});

// Endpoint 5: Automated Placement Notification Drafter
app.post('/api/gemini/draft-notification', async (req, res) => {
  const ai = ensureAI(res);
  if (!ai) return;

  try {
    const { purpose, companyName, channel, targetAudience, extraDetails } = req.body;

    const prompt = `You are CAMPUSLINK Official Placement Communications Officer for Rooman Technologies.
Draft an official placement notification for the college placement cell.

Details:
Purpose: ${purpose || 'Drive Shortlist Announcement'}
Company: ${companyName || 'Rooman Technologies'}
Channel: ${channel || 'WhatsApp'} (Format appropriately: concise with emojis for WhatsApp, professional and structured for Email, ultra-crisp for SMS)
Audience: ${targetAudience || 'Shortlisted Candidates'}
Additional Details: ${extraDetails || 'Carry updated resume, photo ID, dress in formal attire'}

Return ONLY a JSON object:
{
  "subjectOrHeadline": string,
  "messageBody": string,
  "keyChecklist": string[],
  "callToAction": string
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, draft: parsed });
  } catch (error: any) {
    return handleAIError(res, error, '/api/gemini/draft-notification');
  }
});

// Endpoint 6: AI ATS Resume Scorer & Enhancer
app.post('/api/gemini/ats-resume-analyzer', async (req, res) => {
  const ai = ensureAI(res);
  if (!ai) return;

  try {
    const { resumeSummary, skills, targetRole, experience } = req.body;

    const prompt = `You are CAMPUSLINK AI ATS Resume Evaluator for Rooman Technologies.
Analyze this student's profile for the target role "${targetRole || 'Software / Cloud Engineer'}".
Resume Summary: ${resumeSummary || 'Not provided'}
Skills: ${JSON.stringify(skills || [])}
Projects/Internships: ${JSON.stringify(experience || [])}

Provide a comprehensive ATS evaluation in JSON format:
{
  "atsScore": number,
  "benchmarkTier": "High Match (85-100)" | "Moderate Match (70-84)" | "Needs Work (<70)",
  "keyMatchedKeywords": string[],
  "missingCriticalKeywords": string[],
  "bulletImprovements": [
    { "original": string, "improved": string, "impactRationale": string }
  ],
  "actionableTips": string[],
  "overallVerdict": string
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, analysis: parsed });
  } catch (error: any) {
    return handleAIError(res, error, '/api/gemini/ats-resume-analyzer');
  }
});

// Endpoint 7: Mock Interview Simulator (STAR Evaluation)
app.post('/api/gemini/mock-interview-eval', async (req, res) => {
  const ai = ensureAI(res);
  if (!ai) return;

  try {
    const { question, candidateAnswer, targetCompany, role } = req.body;

    const prompt = `You are a Senior Technical Hiring Lead evaluating a campus candidate for ${targetCompany || 'Tier-1 Tech Company'} (${role || 'Software Engineer'}).
Question: "${question}"
Candidate Answer: "${candidateAnswer}"

Evaluate using the STAR technique (Situation, Task, Action, Result) with rigorous corporate standards.
Return ONLY JSON:
{
  "overallScore": number,
  "starAnalysis": {
    "situation": string,
    "task": string,
    "action": string,
    "result": string
  },
  "strengths": string[],
  "areasForImprovement": string[],
  "improvedSampleAnswer": string,
  "followUpQuestion": string
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, evaluation: parsed });
  } catch (error: any) {
    return handleAIError(res, error, '/api/gemini/mock-interview-eval');
  }
});

// Endpoint 8: AI Placement Readiness Accelerator Sprint
app.post('/api/gemini/make-placement-ready', async (req, res) => {
  const ai = ensureAI(res);
  if (!ai) return;

  try {
    const { student, targetCompany, daysUntilDrive } = req.body;

    const prompt = `You are CAMPUSLINK Chief Placement Director at Rooman Technologies.
Create a hyper-accelerated "Placement Ready" sprint plan to elevate ${student?.name || 'this student'} to Corporate Ready status within ${daysUntilDrive || 14} days.
Target Company: ${targetCompany || 'Top Tech & Cloud Recruiters'}
Student Profile:
Branch: ${student?.branch} | CGPA: ${student?.cgpa} | Readiness: ${student?.readinessScore}%
LeetCode Solved: ${student?.leetcodeSolved || 0} | Backlogs: ${student?.activeBacklogs || 0}
Skills: ${JSON.stringify(student?.skills || [])}

Return JSON matching:
{
  "readinessSprintTitle": string,
  "projectedScoreIncrease": number,
  "dailySprintTasks": [
    { "day": number, "module": string, "task": string, "durationMinutes": number, "benchmark": string }
  ],
  "mustKnowCompanyTopics": string[],
  "mockInterviewFocusAreas": string[],
  "rooomRemedialClinicsRecommended": string[]
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, plan: parsed });
  } catch (error: any) {
    return handleAIError(res, error, '/api/gemini/make-placement-ready');
  }
});

// Endpoint 9: Interactive Multi-Turn Conversational Mock Interview
app.post('/api/gemini/interactive-interview', async (req, res) => {
  const ai = ensureAI(res);
  if (!ai) return;

  try {
    const { conversationHistory, targetCompany, targetRole, roundType } = req.body;

    const prompt = `You are an elite Senior Technical Interviewer conducting a realistic campus placement interview for ${targetCompany || 'Tier-1 Tech Recruiter'}.
Role: ${targetRole || 'Software Development Engineer'}
Round: ${roundType || 'Technical & System Design'}

Conversation History:
${JSON.stringify(conversationHistory || [], null, 2)}

If conversation history is empty or candidate just greeted, provide an incisive, engaging opening interview question relevant to the role and tech stack.
If candidate provided an answer, critically analyze it:
1. Provide constructive coaching feedback on their response.
2. Formulate the next question or probing technical follow-up challenge based on their exact words.
3. Detect if interview reached natural conclusion (e.g. 4-5 questions answered).

Return ONLY valid JSON:
{
  "interviewerMessage": string,
  "instantFeedback": {
    "score": number,
    "strengths": string[],
    "improvements": string[],
    "starEvaluation": {
      "situationDetected": boolean,
      "taskDetected": boolean,
      "actionDetected": boolean,
      "resultQuantified": boolean
    }
  },
  "isInterviewComplete": boolean,
  "overallVerdict": string
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, response: parsed });
  } catch (error: any) {
    return handleAIError(res, error, '/api/gemini/interactive-interview');
  }
});

// Endpoint 10: AI Pre-Placement Talk Copilot (Real-Time PPT Q&A)
app.post('/api/gemini/ppt-qa', async (req, res) => {
  const ai = ensureAI(res);
  if (!ai) return;

  try {
    const { talk, question, chatHistory } = req.body;
    if (!talk || !question) {
      return res.status(400).json({ error: 'Talk context and question are required', httpStatus: 400 });
    }

    const prompt = `You are the Official AI Placement Assistant for ${talk.companyName}'s Pre-Placement Talk at Rooman Technologies Campus Placement Cell.
Context about this drive & PPT:
Company: ${talk.companyName}
CTC Package / Overview: ${talk.ctcOverview || 'Competitive industry package'}
Key Topics: ${JSON.stringify(talk.topics || [])}
Mandatory Branches: ${JSON.stringify(talk.mandatoryForBranches || [])}
Speaker: ${talk.speaker?.name || 'Recruiter'} (${talk.speaker?.designation || 'Campus Lead'})
Venue / Mode: ${talk.venueOrLink} (${talk.mode})

Conversation History:
${JSON.stringify(chatHistory || [])}

Student's Question:
"${question}"

Answer authoritatively, accurately, and encouragement-focused.
Return ONLY valid JSON:
{
  "answer": string,
  "keyTakeaways": string[],
  "eligibilityClarification": string,
  "preparationAdvice": string
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, response: parsed });
  } catch (error: any) {
    return handleAIError(res, error, '/api/gemini/ppt-qa');
  }
});

// Endpoint 11: Predictive Placement Radar (At-Risk Early Warning Model)
app.post('/api/gemini/predict-at-risk', async (req, res) => {
  const ai = ensureAI(res);
  if (!ai) return;

  try {
    const { student, cohortContext } = req.body;
    if (!student) {
      return res.status(400).json({ error: 'Student data is required', httpStatus: 400 });
    }

    const prompt = `You are CAMPUSLINK Chief Placement Analytics Director at Rooman Technologies.
Perform a predictive placement risk analysis to calculate the statistical probability of this student remaining unplaced before season concludes.

Candidate Profile:
Name: ${student.name} (${student.usn})
Branch: ${student.branch} | CGPA: ${student.cgpa}
Active Backlogs: ${student.activeBacklogs} | Attendance: ${student.attendancePercent}%
LeetCode Solved: ${student.leetcodeSolved || 0} | Projects: ${student.projectsCount || 0}
Mock Interview Score: ${student.mockInterviewScore || 0}% | Aptitude: ${student.aptitudeScore || 0}%
Current Skills: ${JSON.stringify(student.skills || [])}
Risk Triggers: ${JSON.stringify(student.riskReasons || [])}
Cohort Context: ${JSON.stringify(cohortContext || {})}

Return ONLY valid JSON:
{
  "unplacedProbabilityPercent": number,
  "riskSeverity": "Critical Risk" | "High Risk" | "Moderate Risk" | "Safe / Corporate Ready",
  "primaryRiskDrivers": string[],
  "diagnosticAnalysis": {
    "academicStanding": string,
    "codingProficiency": string,
    "interviewCommunication": string
  },
  "prescribedInterventionRoadmap": [
    { "week": number, "action": string, "targetLiftMetric": string, "roomanClinic": string }
  ],
  "facultyMentorGuidanceNote": string
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, prediction: parsed });
  } catch (error: any) {
    return handleAIError(res, error, '/api/gemini/predict-at-risk');
  }
});

// Endpoint 12: Offer Letter & Compensation Comparator (Total Rewards & Bond Risk)
app.post('/api/gemini/analyze-offer', async (req, res) => {
  const ai = ensureAI(res);
  if (!ai) return;

  try {
    const { offer, rawOfferText } = req.body;
    if (!offer) {
      return res.status(400).json({ error: 'Offer details are required', httpStatus: 400 });
    }

    const prompt = `You are Corporate Compensation & Employment Advisory AI for Rooman Technologies Campus Placement Cell.
Evaluate this corporate offer letter:
Student: ${offer.studentName} (${offer.usn}, ${offer.branch})
Company: ${offer.companyName}
Role: ${offer.role}
Stated CTC: ${offer.ctcLPA} LPA
Offer Details / Text:
"""
${rawOfferText || `Role: ${offer.role}, CTC: ${offer.ctcLPA} LPA, Documents: ${JSON.stringify(offer.documents || [])}`}
"""

Analyze base vs variable splits, potential bond/service agreements, city living costs, and red flags.
Return ONLY valid JSON:
{
  "financialBreakdown": {
    "estimatedFixedBase": string,
    "variableBonus": string,
    "estimatedMonthlyTakeHome": string,
    "totalCompensationLPA": number
  },
  "bondAnalysis": {
    "hasServiceAgreementOrBond": boolean,
    "bondDuration": string,
    "exitPenalty": string,
    "riskLevel": "Low" | "Medium" | "High",
    "advisoryVerdict": string
  },
  "favorableHighlights": string[],
  "hiddenCaveatsOrRedFlags": string[],
  "decisionVerdict": "Recommended to Sign" | "Negotiate Terms" | "Consult Placement Director"
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, analysis: parsed });
  } catch (error: any) {
    return handleAIError(res, error, '/api/gemini/analyze-offer');
  }
});

// Endpoint 13: NIRF & NAAC Statutory Placement Accreditation Report Generator
app.post('/api/gemini/generate-statutory-report', async (req, res) => {
  const ai = ensureAI(res);
  if (!ai) return;

  try {
    const { reportType, stats, batchYear } = req.body;

    const prompt = `You are Chief Institutional Accreditation & Statutory Compliance Officer at Rooman Technologies University Placement Cell.
Generate an official audit-grade report for: ${reportType || 'NIRF 2026 Engineering Data'}.
Academic Batch: ${batchYear || '2022-2026'}
Placement Snapshot:
${JSON.stringify(stats || {}, null, 2)}

Provide formal compliance text and tabular rows ready for statutory upload.
Return ONLY valid JSON:
{
  "reportTitle": string,
  "statutoryStandard": string,
  "executiveNarrative": string,
  "complianceGrade": string,
  "tableHeaders": string[],
  "tableRows": (string | number)[][],
  "institutionalStrengths": string[],
  "auditorVerificationStatement": string
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, report: parsed });
  } catch (error: any) {
    return handleAIError(res, error, '/api/gemini/generate-statutory-report');
  }
});

// Endpoint 14: 1-Click Tailored Resume Architect for Target JDs
app.post('/api/gemini/tailor-resume', async (req, res) => {
  const ai = ensureAI(res);
  if (!ai) return;

  try {
    const { student, targetDrive } = req.body;
    if (!student || !targetDrive) {
      return res.status(400).json({ error: 'Student profile and target drive are required', httpStatus: 400 });
    }

    const prompt = `You are Elite Placement Resume Architect at Rooman Technologies.
Tailor this student's verified profile specifically for the recruiter drive at ${targetDrive.companyName} (${targetDrive.roleTitle}).
Required Skills: ${JSON.stringify(targetDrive.requiredSkills || [])}
Preferred Skills: ${JSON.stringify(targetDrive.preferredSkills || [])}

Student Profile:
Name: ${student.name} | Branch: ${student.branch} | CGPA: ${student.cgpa}
Verified Skills: ${JSON.stringify(student.skills || [])}
Projects: ${JSON.stringify(student.projects || student.topProjects || [])}

Rules:
1. DO NOT invent false work experience.
2. Re-architect project descriptions using the Google X-Y-Z formula: "Accomplished [X] as measured by [Y], by doing [Z]".
3. Embed high-impact keywords aligned with the JD.

Return ONLY valid JSON:
{
  "tailoredHeadline": string,
  "tailoredSummary": string,
  "tailoredProjects": [
    { "title": string, "tailoredBullet": string, "highlightedKeywords": string[] }
  ],
  "recommendedSkillsOrder": string[],
  "projectedAtsMatchPercent": number,
  "tpoReadyVerification": string
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, tailoredResume: parsed });
  } catch (error: any) {
    return handleAIError(res, error, '/api/gemini/tailor-resume');
  }
});

// Endpoint 15: GitHub Portfolio & Code Quality Auditor
app.post('/api/gemini/audit-portfolio', async (req, res) => {
  const ai = ensureAI(res);
  if (!ai) return;

  try {
    const { student, githubRepos } = req.body;
    if (!student) {
      return res.status(400).json({ error: 'Student data is required', httpStatus: 400 });
    }

    const prompt = `You are Principal Software Architect & Code Auditor at Rooman Technologies.
Audit this student's software portfolio and GitHub repositories:
Student: ${student.name} (${student.branch}, CGPA: ${student.cgpa})
Verified Skills: ${JSON.stringify(student.skills || [])}
Projects / Repositories: ${JSON.stringify(githubRepos || student.projects || student.topProjects || [])}

Provide a deep technical code audit in valid JSON:
{
  "engineeringRigorScore": number,
  "codeQualityGrade": "A+ Enterprise Ready" | "A Production Capable" | "B Solid Prototype" | "C Academic Basics",
  "architecturalComplexity": string,
  "topStrengths": string[],
  "codeSmellsOrGaps": string[],
  "testCoverageAndCiCdAssessment": string,
  "recruiterInterviewPitch": string
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, audit: parsed });
  } catch (error: any) {
    return handleAIError(res, error, '/api/gemini/audit-portfolio');
  }
});

// Endpoint 16: Cohort & Department Skill Gap Heatmap
app.post('/api/gemini/cohort-skill-heatmap', async (req, res) => {
  const ai = ensureAI(res);
  if (!ai) return;

  try {
    const { studentsPool, targetDrives } = req.body;
    const prompt = `You are Chief Academic Training Director at Rooman Technologies University Placement Cell.
Analyze batch-wide skill deficits across departments based on this cohort sample:
Students: ${JSON.stringify((studentsPool || []).slice(0, 15).map((s: any) => ({ name: s.name, branch: s.branch, cgpa: s.cgpa, skills: s.skills, backlogs: s.activeBacklogs })))}
Target Company Drives: ${JSON.stringify(targetDrives || ['Google Cloud', 'Cisco', 'Rooman Technologies', 'Deloitte'])}

Return batch-wide skill gap heatmap and bootcamps in valid JSON:
{
  "overallReadinessRate": number,
  "departmentHeatmap": [
    { "branch": string, "deficitSkill": string, "studentsAffectedPercent": number, "severity": "Critical" | "Moderate" | "Low" }
  ],
  "topMissingCompetencies": string[],
  "recommendedRoomanBootcamps": [
    { "title": string, "durationWeeks": number, "targetBranches": string[], "projectedPlacementLift": string }
  ]
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, heatmap: parsed });
  } catch (error: any) {
    return handleAIError(res, error, '/api/gemini/cohort-skill-heatmap');
  }
});

// Endpoint 17: Recruiter Conversion & Corporate Outreach Intelligence
app.post('/api/gemini/outreach-intelligence', async (req, res) => {
  const ai = ensureAI(res);
  if (!ai) return;

  try {
    const { placementStats, mous, topBranches } = req.body;
    const prompt = `You are Corporate Relations & Placement Director at Rooman Technologies.
Evaluate institutional placement history and suggest high-yield companies for university MoU outreach:
Stats: ${JSON.stringify(placementStats || {})}
Existing MoUs: ${JSON.stringify((mous || []).map((m: any) => m.companyName))}
Core Department Strengths: ${JSON.stringify(topBranches || ['CSE', 'IT', 'AI&DS', 'ECE'])}

Return corporate partnership recommendations in valid JSON:
{
  "outreachStrategySummary": string,
  "recommendedTargetCompanies": [
    { "companyName": string, "industry": string, "projectedHiringRoles": string[], "expectedCtcRange": string, "partnershipFitRationale": string }
  ],
  "highDemandNicheSkills": string[],
  "tpoOutreachEmailSubject": string,
  "tpoOutreachPitchTemplate": string
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, intelligence: parsed });
  } catch (error: any) {
    return handleAIError(res, error, '/api/gemini/outreach-intelligence');
  }
});

// Endpoint 18: Recruiter Bulk Weighted Candidate Ranking Copilot
app.post('/api/gemini/bulk-rank-candidates', async (req, res) => {
  const ai = ensureAI(res);
  if (!ai) return;

  try {
    const { candidates, weights, driveContext } = req.body;
    if (!candidates || !candidates.length) {
      return res.status(400).json({ error: 'Candidate list is required', httpStatus: 400 });
    }

    const prompt = `You are Lead Campus Recruiter for ${driveContext?.companyName || 'Tier-1 Recruiter'}.
Apply custom hiring weights to rank these candidates:
Weights: ${JSON.stringify(weights || { dsa: 40, projects: 30, cgpa: 20, softSkills: 10 })}
Role: ${driveContext?.roleTitle || 'Software Development Engineer'}
Candidates:
${JSON.stringify(candidates.slice(0, 12).map((c: any) => ({
  id: c.id, name: c.name, branch: c.branch, cgpa: c.cgpa,
  leetcode: c.leetcodeSolved, aptitude: c.aptitudeScore,
  mockScore: c.mockInterviewScore, backlogs: c.activeBacklogs,
  skills: c.skills
})))}

Return ranked candidate matrix in valid JSON:
{
  "rankingRationale": string,
  "rankedCandidates": [
    {
      "candidateId": string,
      "candidateName": string,
      "weightedScore": number,
      "rank": number,
      "recommendation": "Priority Shortlist" | "Consider" | "Reject",
      "justification": string,
      "standoutStrength": string
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, ranking: parsed });
  } catch (error: any) {
    return handleAIError(res, error, '/api/gemini/bulk-rank-candidates');
  }
});

// Endpoint 19: Technical Assessment & MCQ / Coding Challenge Generator
app.post('/api/gemini/generate-assessment', async (req, res) => {
  const ai = ensureAI(res);
  if (!ai) return;

  try {
    const { roleTitle, companyName, techStack, difficulty } = req.body;
    const prompt = `You are Principal Assessment Engineer at Rooman Technologies.
Create a screening assessment for ${companyName || 'Tech Partner'} (${roleTitle || 'Full Stack Engineer'}).
Tech Stack: ${JSON.stringify(techStack || ['Python', 'SQL', 'FastAPI', 'Docker'])}
Difficulty: ${difficulty || 'Intermediate'}

Return assessment spec in valid JSON:
{
  "assessmentTitle": string,
  "timeLimitMinutes": number,
  "codingChallenge": {
    "title": string,
    "problemStatement": string,
    "inputFormat": string,
    "outputFormat": string,
    "constraints": string,
    "sampleTestCases": [
      { "input": string, "output": string, "explanation": string }
    ]
  },
  "technicalMcqs": [
    { "question": string, "options": string[], "correctOptionIndex": number, "explanation": string }
  ]
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, assessment: parsed });
  } catch (error: any) {
    return handleAIError(res, error, '/api/gemini/generate-assessment');
  }
});

// Endpoint 20: APAAR Academic Credential Fraud & Anomaly Detector
app.post('/api/gemini/audit-apaar-credentials', async (req, res) => {
  const ai = ensureAI(res);
  if (!ai) return;

  try {
    const { student } = req.body;
    if (!student) {
      return res.status(400).json({ error: 'Student profile required', httpStatus: 400 });
    }

    const prompt = `You are Chief Academic Registrar & National DigiLocker / APAAR Credential Auditor.
Audit student resume claims against Government of India Academic Bank of Credits (ABC) data:
Student: ${student.name} (${student.usn})
Claimed CGPA: ${student.cgpa} | Branch: ${student.branch}
Claimed Backlogs: ${student.activeBacklogs}
Claimed Certifications: ${JSON.stringify(student.certifications || [])}
Official APAAR Record:
APAAR ID: ${student.apaarRecord?.apaarId || '9842-1049-3821'}
DigiLocker Verified: ${student.apaarRecord?.digiLockerVerified ? 'YES' : 'NO'}
Earned Credits: ${student.apaarRecord?.totalCreditsEarned} / ${student.apaarRecord?.totalCreditsRequired}
Semester SGPAs: ${JSON.stringify(student.apaarRecord?.semesterRecords || [])}

Return credential integrity audit in valid JSON:
{
  "integrityScore": number,
  "fraudRiskLevel": "Clean / Fully Verified" | "Low Discrepancy" | "High Inflation Flagged",
  "discrepancies": string[],
  "verifiedClaims": string[],
  "apaarNationalIdStatus": string,
  "registrarClearanceStatement": string
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, audit: parsed });
  } catch (error: any) {
    return handleAIError(res, error, '/api/gemini/audit-apaar-credentials');
  }
});

// Endpoint 21: Interviewer Live In-Round Copilot
app.post('/api/gemini/interviewer-copilot', async (req, res) => {
  const ai = ensureAI(res);
  if (!ai) return;

  try {
    const { candidate, roleTitle, companyName } = req.body;
    if (!candidate) {
      return res.status(400).json({ error: 'Candidate profile required', httpStatus: 400 });
    }

    const prompt = `You are Chief Technical Hiring Lead for ${companyName || 'Enterprise Partner'}.
Generate personalized technical interview questions targeting this student's specific resume projects:
Candidate: ${candidate.name} (${candidate.branch}, CGPA: ${candidate.cgpa})
Target Role: ${roleTitle || 'Cloud Solutions Engineer'}
Projects: ${JSON.stringify(candidate.projects || candidate.topProjects || [])}
Skills: ${JSON.stringify(candidate.skills || [])}

Return probing questions in valid JSON:
{
  "candidateTechnicalSummary": string,
  "targetedQuestions": [
    {
      "projectReferenced": string,
      "probingQuestion": string,
      "whatToListenForInAnswer": string,
      "redFlagAnswer": string
    }
  ],
  "stressTestScenario": string
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, copilot: parsed });
  } catch (error: any) {
    return handleAIError(res, error, '/api/gemini/interviewer-copilot');
  }
});

// Endpoint 22: 24/7 Campus Placement Helpdesk Chatbot
app.post('/api/gemini/campus-helpdesk', async (req, res) => {
  const ai = ensureAI(res);
  if (!ai) return;

  try {
    const { userMessage, chatHistory, studentContext } = req.body;
    if (!userMessage) {
      return res.status(400).json({ error: 'userMessage is required', httpStatus: 400 });
    }

    const prompt = `You are CAMPUSLINK 24/7 AI Placement Helpdesk Assistant at Rooman Technologies University Placement Cell.
Assist students with placement rules, eligibility criteria, dress code, schedule questions, and remedial clinics.
Student Context: ${JSON.stringify(studentContext || { role: 'Student' })}
Chat History: ${JSON.stringify(chatHistory || [])}
Student Question: "${userMessage}"

Placement Cell Rules:
- Mandatory 75% attendance in placement training to qualify for drives.
- Formal corporate attire required on all drive days.
- Maximum 1 active backlog allowed for Tier-2, 0 for Tier-1 Super Dream drives.
- PPT (Pre-Placement Talk) attendance is compulsory for assessment link activation.
- Once a student accepts a corporate offer >= ₹8 LPA, they cannot appear for further drives (Dream Offer Policy).

Return answer in valid JSON:
{
  "reply": string,
  "suggestedFollowUps": string[],
  "policyReference": string
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, response: parsed });
  } catch (error: any) {
    return handleAIError(res, error, '/api/gemini/campus-helpdesk');
  }
});

// Endpoint 23: Drive Day Turnout & Queue Optimization AI
app.post('/api/gemini/optimize-drive-queues', async (req, res) => {
  const ai = ensureAI(res);
  if (!ai) return;

  try {
    const { registeredCount, checkedInCount, activeSuites, driveDetails } = req.body;
    const prompt = `You are Ground Logistics & Operations AI Optimizer for Rooman Technologies campus placement cell.
Optimize interview queues and predict attendance:
Drive: ${JSON.stringify(driveDetails || { company: 'Campus Drive', date: 'Today' })}
Registered: ${registeredCount || 120} | Checked In: ${checkedInCount || 95}
Active Interview Suites: ${activeSuites || 4}

Return queue balancing strategy in valid JSON:
{
  "predictedTurnoutPercent": number,
  "estimatedWaitTimeMinutes": number,
  "bottleneckRisk": "Low" | "Medium" | "High",
  "queueRebalancingActions": string[],
  "roomAllocationPlan": [
    { "suiteName": string, "assignedBatch": string, "targetCandidatesPerHour": number }
  ],
  "coordinatorNotice": string
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, optimization: parsed });
  } catch (error: any) {
    return handleAIError(res, error, '/api/gemini/optimize-drive-queues');
  }
});

// Setup Vite middleware for development or serve dist in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CAMPUSLINK Server running on http://0.0.0.0:${PORT}`);
    // Connect to MongoDB Atlas asynchronously
    initMongoDB().catch((err) => {
      console.warn('[MongoDB] Initial connection attempt deferred:', err?.message || err);
    });
  });
}


startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
