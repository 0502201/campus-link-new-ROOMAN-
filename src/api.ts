import {
  StudentProfile,
  RecruiterDrive,
  DriveScheduleSlot,
  ScheduleConflict,
  OfferRecord,
  BroadcastNotification,
  PlacementStats,
  PlacementPreTalk
} from './types';

// API Service connecting frontend seamlessly to backend & SQLite database
export const api = {
  // Fetch full state snapshot on load
  getState: async (): Promise<{
    students: StudentProfile[];
    drives: RecruiterDrive[];
    slots: DriveScheduleSlot[];
    conflicts: ScheduleConflict[];
    offers: OfferRecord[];
    notifications: BroadcastNotification[];
    preTalks: PlacementPreTalk[];
    stats: PlacementStats;
  }> => {
    const res = await fetch('/api/db/state');
    if (!res.ok) throw new Error('Failed to load database state');
    return res.json();
  },

  resetDatabase: async () => {
    const res = await fetch('/api/db/reset', { method: 'POST' });
    return res.json();
  },

  // Students
  students: {
    list: async (filters?: { branch?: string; tier?: string; status?: string; query?: string }) => {
      const params = new URLSearchParams(filters as any);
      const res = await fetch(`/api/students?${params.toString()}`);
      return res.json();
    },
    get: async (id: string): Promise<StudentProfile> => {
      const res = await fetch(`/api/students/${id}`);
      const data = await res.json();
      return data.student;
    },
    create: async (student: StudentProfile): Promise<StudentProfile> => {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student)
      });
      const data = await res.json();
      return data.student;
    },
    update: async (id: string, updates: Partial<StudentProfile>): Promise<StudentProfile> => {
      const res = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      return data.student;
    },
    delete: async (id: string) => {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      return res.json();
    }
  },

  // Drives
  drives: {
    list: async (): Promise<RecruiterDrive[]> => {
      const res = await fetch('/api/drives');
      const data = await res.json();
      return data.drives;
    },
    create: async (drive: RecruiterDrive): Promise<RecruiterDrive> => {
      const res = await fetch('/api/drives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(drive)
      });
      const data = await res.json();
      return data.drive;
    },
    update: async (id: string, updates: Partial<RecruiterDrive>): Promise<RecruiterDrive> => {
      const res = await fetch(`/api/drives/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      return data.drive;
    }
  },

  // Pre-Talks (PPT)
  preTalks: {
    list: async (): Promise<PlacementPreTalk[]> => {
      const res = await fetch('/api/pre-talks');
      const data = await res.json();
      return data.preTalks;
    },
    create: async (talk: PlacementPreTalk): Promise<PlacementPreTalk> => {
      const res = await fetch('/api/pre-talks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(talk)
      });
      const data = await res.json();
      return data.talk;
    },
    toggleRsvp: async (talkId: string, studentId: string): Promise<PlacementPreTalk> => {
      const res = await fetch(`/api/pre-talks/${talkId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      });
      const data = await res.json();
      return data.talk;
    }
  },

  // Scheduler & Conflicts
  scheduler: {
    getSlots: async (): Promise<{ slots: DriveScheduleSlot[]; conflicts: ScheduleConflict[] }> => {
      const res = await fetch('/api/scheduler/slots');
      return res.json();
    },
    addSlot: async (slot: DriveScheduleSlot): Promise<{ slot: DriveScheduleSlot; conflicts: ScheduleConflict[] }> => {
      const res = await fetch('/api/scheduler/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slot)
      });
      return res.json();
    },
    resolveConflict: async (conflictId: string): Promise<{ success: boolean; conflicts: ScheduleConflict[] }> => {
      const res = await fetch(`/api/scheduler/conflicts/${conflictId}/resolve`, {
        method: 'POST'
      });
      return res.json();
    }
  },

  // Offers & Documentation
  offers: {
    list: async (): Promise<OfferRecord[]> => {
      const res = await fetch('/api/offers');
      const data = await res.json();
      return data.offers;
    },
    create: async (offer: OfferRecord): Promise<OfferRecord> => {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offer)
      });
      const data = await res.json();
      return data.offer;
    },
    updateStatus: async (id: string, status: OfferRecord['status']): Promise<OfferRecord> => {
      const res = await fetch(`/api/offers/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      return data.offer;
    },
    verifyDoc: async (offerId: string, docIndex: number, verified: boolean): Promise<OfferRecord> => {
      const res = await fetch(`/api/offers/${offerId}/verify-document`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docIndex, verified })
      });
      const data = await res.json();
      return data.offer;
    }
  },

  // Notifications
  notifications: {
    list: async (): Promise<BroadcastNotification[]> => {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      return data.notifications;
    },
    send: async (notif: BroadcastNotification): Promise<BroadcastNotification> => {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notif)
      });
      const data = await res.json();
      return data.notification;
    }
  },

  // Stats
  stats: {
    get: async (): Promise<PlacementStats> => {
      const res = await fetch('/api/stats');
      const data = await res.json();
      return data.stats;
    }
  },

  // MongoDB Atlas Integration
  mongodb: {
    getStatus: async (): Promise<{
      success: boolean;
      connected: boolean;
      uriConfigured: boolean;
      clusterHost?: string;
      databaseName?: string;
      modelsLoaded: string[];
      lastError?: string;
      mode: string;
    }> => {
      const res = await fetch('/api/mongodb/status');
      return res.json();
    },
    connect: async (uri: string) => {
      const res = await fetch('/api/mongodb/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri })
      });
      return res.json();
    }
  },

  // 100% Real Generative AI Services via Google Gemini
  ai: {
    analyzeJd: async (jdText: string, companyName?: string) => {
      const res = await fetch('/api/gemini/analyze-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jdText, companyName })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        throw new Error(err.error || `HTTP ${res.status}: Failed to analyze JD`);
      }
      return res.json();
    },
    matchCandidate: async (student: any, drive: any) => {
      const res = await fetch('/api/gemini/match-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student, drive })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        throw new Error(err.error || `HTTP ${res.status}: Candidate matching failed`);
      }
      return res.json();
    },
    skillGapAdvisor: async (student: any, targetDomain?: string) => {
      const res = await fetch('/api/gemini/skill-gap-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student, targetDomain })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        throw new Error(err.error || `HTTP ${res.status}: Skill gap advisory failed`);
      }
      return res.json();
    },
    resolveScheduleConflict: async (conflict: any, availableSlots?: string[], venues?: string[]) => {
      const res = await fetch('/api/gemini/resolve-schedule-conflict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conflict, availableSlots, venues })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        throw new Error(err.error || `HTTP ${res.status}: Schedule conflict resolution failed`);
      }
      return res.json();
    },
    draftNotification: async (params: { purpose?: string; companyName?: string; channel?: string; targetAudience?: string; extraDetails?: string }) => {
      const res = await fetch('/api/gemini/draft-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        throw new Error(err.error || `HTTP ${res.status}: Notification drafting failed`);
      }
      return res.json();
    },
    atsResumeAnalyzer: async (params: { resumeSummary?: string; skills?: any[]; targetRole?: string; experience?: any[] }) => {
      const res = await fetch('/api/gemini/ats-resume-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        throw new Error(err.error || `HTTP ${res.status}: ATS resume analysis failed`);
      }
      return res.json();
    },
    mockInterviewEval: async (params: { question: string; candidateAnswer: string; targetCompany?: string; role?: string }) => {
      const res = await fetch('/api/gemini/mock-interview-eval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        throw new Error(err.error || `HTTP ${res.status}: Interview evaluation failed`);
      }
      return res.json();
    },
    makePlacementReady: async (params: { student: any; targetCompany?: string; daysUntilDrive?: number }) => {
      const res = await fetch('/api/gemini/make-placement-ready', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        throw new Error(err.error || `HTTP ${res.status}: Readiness plan generation failed`);
      }
      return res.json();
    },
    interactiveInterview: async (params: { conversationHistory: any[]; targetCompany?: string; targetRole?: string; roundType?: string }) => {
      const res = await fetch('/api/gemini/interactive-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        throw new Error(err.error || `HTTP ${res.status}: Interactive interview failed`);
      }
      return res.json();
    },
    pptQa: async (params: { talk: any; question: string; chatHistory?: any[] }) => {
      const res = await fetch('/api/gemini/ppt-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        throw new Error(err.error || `HTTP ${res.status}: Pre-talk Q&A failed`);
      }
      return res.json();
    },
    predictAtRisk: async (params: { student: any; cohortContext?: any }) => {
      const res = await fetch('/api/gemini/predict-at-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        throw new Error(err.error || `HTTP ${res.status}: Predictive placement radar failed`);
      }
      return res.json();
    },
    analyzeOffer: async (params: { offer: any; rawOfferText?: string }) => {
      const res = await fetch('/api/gemini/analyze-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        throw new Error(err.error || `HTTP ${res.status}: Offer analysis failed`);
      }
      return res.json();
    },
    generateStatutoryReport: async (params: { reportType: string; stats: any; batchYear?: string }) => {
      const res = await fetch('/api/gemini/generate-statutory-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        throw new Error(err.error || `HTTP ${res.status}: Statutory report generation failed`);
      }
      return res.json();
    },
    tailorResume: async (params: { student: any; targetDrive: any }) => {
      const res = await fetch('/api/gemini/tailor-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        throw new Error(err.error || `HTTP ${res.status}: Resume tailoring failed`);
      }
      return res.json();
    },
    auditPortfolio: async (params: { student: any; githubRepos?: any[] }) => {
      const res = await fetch('/api/gemini/audit-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        throw new Error(err.error || `HTTP ${res.status}: Portfolio audit failed`);
      }
      return res.json();
    },
    cohortSkillHeatmap: async (params: { studentsPool?: any[]; targetDrives?: string[] }) => {
      const res = await fetch('/api/gemini/cohort-skill-heatmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        throw new Error(err.error || `HTTP ${res.status}: Cohort skill heatmap analysis failed`);
      }
      return res.json();
    },
    outreachIntelligence: async (params: { placementStats?: any; mous?: any[]; topBranches?: string[] }) => {
      const res = await fetch('/api/gemini/outreach-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        throw new Error(err.error || `HTTP ${res.status}: Outreach intelligence failed`);
      }
      return res.json();
    },
    bulkRankCandidates: async (params: { candidates: any[]; weights?: any; driveContext?: any }) => {
      const res = await fetch('/api/gemini/bulk-rank-candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        throw new Error(err.error || `HTTP ${res.status}: Bulk candidate ranking failed`);
      }
      return res.json();
    },
    generateAssessment: async (params: { roleTitle: string; companyName?: string; techStack?: string[]; difficulty?: string }) => {
      const res = await fetch('/api/gemini/generate-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        throw new Error(err.error || `HTTP ${res.status}: Assessment generation failed`);
      }
      return res.json();
    },
    auditApaarCredentials: async (params: { student: any }) => {
      const res = await fetch('/api/gemini/audit-apaar-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        throw new Error(err.error || `HTTP ${res.status}: APAAR credential audit failed`);
      }
      return res.json();
    },
    interviewerCopilot: async (params: { candidate: any; roleTitle?: string; companyName?: string }) => {
      const res = await fetch('/api/gemini/interviewer-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        throw new Error(err.error || `HTTP ${res.status}: Interviewer copilot failed`);
      }
      return res.json();
    },
    campusHelpdesk: async (params: { userMessage: string; chatHistory?: any[]; studentContext?: any }) => {
      const res = await fetch('/api/gemini/campus-helpdesk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        throw new Error(err.error || `HTTP ${res.status}: Placement helpdesk assistant failed`);
      }
      return res.json();
    },
    optimizeDriveQueues: async (params: { registeredCount?: number; checkedInCount?: number; activeSuites?: number; driveDetails?: any }) => {
      const res = await fetch('/api/gemini/optimize-drive-queues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        throw new Error(err.error || `HTTP ${res.status}: Drive queue optimization failed`);
      }
      return res.json();
    }
  }
};

