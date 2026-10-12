import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  FileCheck,
  MessageSquare,
  Award,
  Zap,
  TrendingUp,
  Target,
  Clock,
  BookOpen,
  Code,
  Layers,
  ChevronRight,
  RotateCcw,
  Check,
  Send,
  Copy,
  FileText,
  RefreshCw,
  Play,
  CheckCheck,
  GitBranch,
  Terminal,
  ShieldCheck,
  FileCode
} from 'lucide-react';
import { StudentProfile, UserRole } from '../types';
import { api } from '../api';

interface MakePlacementReadyProps {
  students: StudentProfile[];
  currentStudentId?: string;
  userRole: UserRole;
  onUpdateStudent: (updatedStudent: StudentProfile) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const MakePlacementReady: React.FC<MakePlacementReadyProps> = ({
  students,
  currentStudentId = 'std-105',
  userRole,
  onUpdateStudent,
  onNavigateToTab
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(currentStudentId);
  const selectedStudent =
    students.find((s) => s.id === selectedStudentId) || students[0];

  // Active module inside Placement Ready Hub
  const [activeSubTab, setActiveSubTab] = useState<'sprint' | 'mock-interview' | 'ats-resume' | 'diagnostic' | 'github-portfolio'>('sprint');

  // Interactive 4-Week Checklist State
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({
    't-1': true,
    't-2': true,
    't-3': false,
    't-4': false,
    't-5': false,
    't-6': false,
    't-7': false,
    't-8': false
  });

  // Mock Interview Simulator State
  const [selectedRole, setSelectedRole] = useState('Associate Cloud & AI Solutions Engineer');
  const [selectedCompany, setSelectedCompany] = useState('Rooman Technologies');
  const [interviewQuestion, setInterviewQuestion] = useState(
    'Describe a challenging project bug you resolved under tight deadlines. Walk me through your debugging methodology.'
  );
  const [candidateAnswer, setCandidateAnswer] = useState(
    'In our semester project, we faced memory leaks and database connection timeouts during concurrent user loads. I analyzed the logs using Python cProfile and realized our database pool was exhausted because connections were not being closed in async route exceptions. I implemented a context manager and connection retry pool, which dropped timeouts to zero.'
  );
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [interviewEvaluation, setInterviewEvaluation] = useState<any>(null);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  // Interactive Multi-Turn Conversational Interview State
  const [interviewMode, setInterviewMode] = useState<'interactive' | 'single'>('interactive');
  const [interactiveRound, setInteractiveRound] = useState<'Technical & System Design' | 'Coding Logic & DSA' | 'Managerial & Behavioral HR'>('Technical & System Design');
  const [interactiveHistory, setInteractiveHistory] = useState<Array<{ role: 'interviewer' | 'candidate'; text: string; feedback?: any }>>([]);
  const [interactiveInput, setInteractiveInput] = useState('');
  const [isInteractiveLoading, setIsInteractiveLoading] = useState(false);
  const [interactiveError, setInteractiveError] = useState<string | null>(null);
  const [finalInterviewSummary, setFinalInterviewSummary] = useState<string | null>(null);

  // ATS Resume Optimizer State
  const [resumeMode, setResumeMode] = useState<'tailor' | 'scan'>('tailor');
  const [targetCompanyForResume, setTargetCompanyForResume] = useState('Rooman Technologies');
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null);
  const [atsScanError, setAtsScanError] = useState<string | null>(null);

  // 1-Click Tailored Resume State
  const [targetDriveForTailor, setTargetDriveForTailor] = useState('Rooman Technologies');
  const [isTailoringResume, setIsTailoringResume] = useState(false);
  const [tailoredResume, setTailoredResume] = useState<any | null>(null);
  const [tailorError, setTailorError] = useState<string | null>(null);
  const [resumeCopied, setResumeCopied] = useState(false);

  // GitHub Portfolio & Code Auditor State
  const [isAuditingPortfolio, setIsAuditingPortfolio] = useState(false);
  const [portfolioAudit, setPortfolioAudit] = useState<any | null>(null);
  const [portfolioAuditError, setPortfolioAuditError] = useState<string | null>(null);
  const [customRepoUrl, setCustomRepoUrl] = useState('');

  // 1-Click Fast-Track Elevation
  const [isElevating, setIsElevating] = useState(false);
  const [elevationSuccess, setElevationSuccess] = useState(false);

  // Run AI GitHub Portfolio & Code Quality Audit
  const handleAuditPortfolio = async () => {
    setIsAuditingPortfolio(true);
    setPortfolioAuditError(null);
    try {
      const repos = customRepoUrl.trim()
        ? [{ name: customRepoUrl.split('/').pop() || 'Repository', url: customRepoUrl, description: 'Candidate Submitted Repository' }]
        : (selectedStudent.projects && selectedStudent.projects.length > 0)
        ? selectedStudent.projects
        : [
            { name: 'Distributed-Cache-System', tech: 'Go, Redis, gRPC', description: 'High-throughput in-memory cache with LRU eviction' },
            { name: 'Placement-Analytics-Engine', tech: 'TypeScript, React, Node.js', description: 'Real-time placement lifecycle management dashboard' }
          ];

      const res = await api.ai.auditPortfolio({
        student: selectedStudent,
        githubRepos: repos
      });

      if (res?.audit) {
        setPortfolioAudit(res.audit);
      } else {
        throw new Error('Malformed audit response from Gemini AI');
      }
    } catch (err: any) {
      console.error('Portfolio audit error:', err);
      setPortfolioAuditError(err.message || 'Failed to audit portfolio');
    } finally {
      setIsAuditingPortfolio(false);
    }
  };

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      return next;
    });
  };

  const completedCount = Object.values(completedTasks).filter(Boolean).length;
  const totalTasks = 8;
  const progressPercent = Math.round((completedCount / totalTasks) * 100);

  // Handle 1-click upgrade to Placement Ready
  const handleElevateToReady = () => {
    setIsElevating(true);
    setTimeout(() => {
      const updated: StudentProfile = {
        ...selectedStudent,
        readinessScore: Math.min(96, Math.max(selectedStudent.readinessScore + 25, 88)),
        tier: 'Corporate Ready',
        mockInterviewScore: Math.max(selectedStudent.mockInterviewScore, 88),
        aptitudeScore: Math.max(selectedStudent.aptitudeScore, 85),
        isAtRisk: false,
        riskReasons: [],
        certifications: [
          'Rooman Corporate Readiness Fast-Track Certified',
          ...selectedStudent.certifications
        ]
      };
      onUpdateStudent(updated);
      setIsElevating(false);
      setElevationSuccess(true);
      setTimeout(() => setElevationSuccess(false), 4000);
    }, 1200);
  };

  // Run AI Interview Evaluation with Gemini endpoint
  const handleEvaluateAnswer = async () => {
    if (!candidateAnswer.trim()) return;
    setIsEvaluating(true);
    setEvaluationError(null);
    try {
      const response = await fetch('/api/gemini/mock-interview-eval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: interviewQuestion,
          candidateAnswer,
          targetCompany: selectedCompany,
          role: selectedRole
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      setInterviewEvaluation(data.evaluation);
    } catch (err: any) {
      console.error(err);
      setEvaluationError(err.message || 'Failed to evaluate interview answer');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Start Interactive Conversational Interview
  const handleStartInteractiveInterview = async () => {
    setIsInteractiveLoading(true);
    setInteractiveError(null);
    setFinalInterviewSummary(null);
    setInteractiveHistory([]);

    try {
      const res = await fetch('/api/gemini/interactive-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationHistory: [],
          targetCompany: selectedCompany,
          targetRole: selectedRole,
          roundType: interactiveRound
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      setInteractiveHistory([
        { role: 'interviewer', text: data.response.interviewerMessage }
      ]);
    } catch (err: any) {
      console.error('Interactive interview failed:', err);
      setInteractiveError(err.message || 'Failed to initialize conversational interview');
    } finally {
      setIsInteractiveLoading(false);
    }
  };

  // Send candidate answer in interactive interview
  const handleSendInteractiveAnswer = async () => {
    if (!interactiveInput.trim()) return;
    const answerText = interactiveInput.trim();
    setInteractiveInput('');
    setInteractiveError(null);

    const updatedHistory = [
      ...interactiveHistory,
      { role: 'candidate' as const, text: answerText }
    ];
    setInteractiveHistory(updatedHistory);
    setIsInteractiveLoading(true);

    try {
      const res = await fetch('/api/gemini/interactive-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationHistory: updatedHistory,
          targetCompany: selectedCompany,
          targetRole: selectedRole,
          roundType: interactiveRound
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      setInteractiveHistory([
        ...updatedHistory,
        {
          role: 'interviewer',
          text: data.response.interviewerMessage,
          feedback: data.response.instantFeedback
        }
      ]);
      if (data.response.isInterviewComplete) {
        setFinalInterviewSummary(data.response.overallVerdict || 'Interview session completed.');
      }
    } catch (err: any) {
      console.error('Interactive answer evaluation failed:', err);
      setInteractiveError(err.message || 'Failed to process interview response');
    } finally {
      setIsInteractiveLoading(false);
    }
  };

  const handleResetInteractiveInterview = () => {
    setInteractiveHistory([]);
    setInteractiveInput('');
    setInteractiveError(null);
    setFinalInterviewSummary(null);
  };

  // Run AI ATS Resume Analysis with Gemini endpoint
  const handleAnalyzeResume = async () => {
    setIsAnalyzingResume(true);
    setAtsScanError(null);
    try {
      const response = await fetch('/api/gemini/ats-resume-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeSummary: selectedStudent.resume?.summary || 'Computer science student seeking software development role',
          skills: selectedStudent.skills,
          targetRole: selectedRole,
          experience: selectedStudent.internships
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      setResumeAnalysis(data.analysis);
    } catch (err: any) {
      console.error(err);
      setAtsScanError(err.message || 'Failed to analyze resume');
    } finally {
      setIsAnalyzingResume(false);
    }
  };

  // 1-Click Tailor Resume for Target Recruiter JD
  const handleTailorResume = async () => {
    setIsTailoringResume(true);
    setTailorError(null);
    setTailoredResume(null);

    try {
      const res = await fetch('/api/gemini/tailor-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: selectedStudent,
          targetDrive: {
            companyName: targetDriveForTailor,
            roleTitle: selectedRole,
            requiredSkills: ['Python / TypeScript', 'FastAPI / React', 'System Architecture', 'Cloud Services', 'REST APIs'],
            preferredSkills: ['Docker & Kubernetes', 'Vector Search / AI Agents', 'PostgreSQL / MongoDB']
          }
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      setTailoredResume(data.tailoredResume);
    } catch (err: any) {
      console.error('Resume tailor failed:', err);
      setTailorError(err.message || 'Failed to tailor resume with Gemini');
    } finally {
      setIsTailoringResume(false);
    }
  };

  const handleCopyTailoredResume = () => {
    if (!tailoredResume) return;
    const text = `HEADLINE: ${tailoredResume.tailoredHeadline}
SUMMARY:
${tailoredResume.tailoredSummary}

PROJECT BULLETS (Google X-Y-Z Formula):
${(tailoredResume.tailoredProjects || []).map((p: any) => `• ${p.title}: ${p.tailoredBullet}`).join('\n')}

RECOMMENDED SKILLS ORDER:
${(tailoredResume.recommendedSkillsOrder || []).join(' • ')}

TPO VERIFICATION:
${tailoredResume.tpoReadyVerification}`;

    navigator.clipboard.writeText(text);
    setResumeCopied(true);
    setTimeout(() => setResumeCopied(false), 3000);
  };

  return (
    <div id="make-placement-ready-container" className="space-y-6">
      {/* Top Banner with Student Selector & Status */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white shadow-sm">
              <Zap className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Placement Readiness Accelerator
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <Sparkles className="w-3 h-3 inline mr-1 text-indigo-500" />
                  AI Coach &amp; Clinic
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Elevate students from "Needs Training" or "Near Ready" to "Corporate Ready" through personalized sprints.
              </p>
            </div>
          </div>
        </div>

        {/* Student Selector */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Target Student:</span>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="bg-transparent font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.branch} • {s.tier})
                </option>
              ))}
            </select>
          </div>

          <button
            id="elevate-readiness-btn"
            onClick={handleElevateToReady}
            disabled={isElevating || selectedStudent.tier === 'Corporate Ready'}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition flex items-center space-x-2 shrink-0 ${
              selectedStudent.tier === 'Corporate Ready'
                ? 'bg-emerald-600 cursor-default'
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
            }`}
          >
            {isElevating ? (
              <>
                <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Accelerating...</span>
              </>
            ) : selectedStudent.tier === 'Corporate Ready' ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified Corporate Ready</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>1-Click Make Placement Ready</span>
              </>
            )}
          </button>
        </div>
      </div>

      {elevationSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center space-x-3 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold">Student Successfully Elevated to Corporate Ready!</p>
            <p className="text-[11px] text-emerald-700">
              Readiness index upgraded to 88%+, Rooman Remedial Clinic clearance issued, and recruiter shortlist eligibility unlocked.
            </p>
          </div>
        </div>
      )}

      {/* Student Overview Snapshot */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center font-black text-xl text-white shadow-md">
              {selectedStudent.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-lg font-black">{selectedStudent.name}</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    selectedStudent.tier === 'Corporate Ready'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      : selectedStudent.tier === 'Near Ready'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                  }`}
                >
                  {selectedStudent.tier}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                USN: {selectedStudent.usn} • APAAR ID: {selectedStudent.apaarRecord.apaarId} • {selectedStudent.branch} (CGPA: {selectedStudent.cgpa})
              </p>
            </div>
          </div>

          {/* Readiness Meter & Key KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto text-xs">
            <div className="bg-white/10 p-3 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-400 block">Readiness Index</span>
              <span className="text-lg font-black text-white">{selectedStudent.readinessScore}/100</span>
            </div>
            <div className="bg-white/10 p-3 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-400 block">LeetCode Solved</span>
              <span className="text-lg font-black text-white">{selectedStudent.leetcodeSolved}</span>
            </div>
            <div className="bg-white/10 p-3 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-400 block">Mock Interview</span>
              <span className="text-lg font-black text-white">{selectedStudent.mockInterviewScore}%</span>
            </div>
            <div className="bg-white/10 p-3 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-400 block">ATS Resume Score</span>
              <span className="text-lg font-black text-emerald-400">{selectedStudent.resume?.atsScore || 85}%</span>
            </div>
          </div>
        </div>

        {/* Sprint Progress Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-300 font-semibold">
              Readiness Sprint Progress: {completedCount} of {totalTasks} Tasks Completed ({progressPercent}%)
            </span>
          </div>
          <div className="w-full sm:w-64 bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sub-Navigation Pill Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveSubTab('sprint')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'sprint'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>4-Week Readiness Sprint</span>
        </button>

        <button
          onClick={() => setActiveSubTab('mock-interview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'mock-interview'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>AI Technical Mock Interview</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ats-resume')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'ats-resume'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>AI ATS Resume Optimizer</span>
        </button>

        <button
          onClick={() => setActiveSubTab('diagnostic')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'diagnostic'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <BrainCircuit className="w-3.5 h-3.5" />
          <span>Multi-Metric Radar Diagnostic</span>
        </button>

        <button
          id="github-portfolio-tab-btn"
          onClick={() => setActiveSubTab('github-portfolio')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'github-portfolio'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>AI GitHub &amp; Code Auditor</span>
        </button>
      </div>

      {/* Sub-Tab 1: 4-Week Readiness Sprint Checklist */}
      {activeSubTab === 'sprint' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Week 1 & 2 */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                  Week 1: Algorithmic Foundations
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">Target: Pass Cutoff Benchmarks</span>
              </div>
              <div className="space-y-2.5">
                {[
                  {
                    id: 't-1',
                    title: 'Solve 25 LeetCode Mediums on Two-Pointers & Sliding Window',
                    desc: 'Build speed under 20-minute constraints for Tier-1 coding tests.'
                  },
                  {
                    id: 't-2',
                    title: 'Complete Rooman Quantitative & Logical Reasoning Mock #1',
                    desc: 'Score minimum 75% across speed-math, probability & syllogisms.'
                  }
                ].map((t) => (
                  <div
                    key={t.id}
                    onClick={() => toggleTask(t.id)}
                    className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition ${
                      completedTasks[t.id]
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-slate-900 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                        completedTasks[t.id]
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{t.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                  Week 2: Core CS &amp; System Architecture
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">Target: Architecture Defense</span>
              </div>
              <div className="space-y-2.5">
                {[
                  {
                    id: 't-3',
                    title: 'Review Operating Systems (Process Scheduling, Deadlocks, Virtual Memory)',
                    desc: 'Prepare for technical round core theory questions.'
                  },
                  {
                    id: 't-4',
                    title: 'Design a Scalable Distributed Cache & Explain Redis Integration',
                    desc: 'Deliver an architecture diagram with trade-offs in project viva.'
                  }
                ].map((t) => (
                  <div
                    key={t.id}
                    onClick={() => toggleTask(t.id)}
                    className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition ${
                      completedTasks[t.id]
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-slate-900 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                        completedTasks[t.id]
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{t.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Week 3 & 4 */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded">
                  Week 3: Behavioral STAR &amp; Mock Technicals
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">Target: Interview Readiness</span>
              </div>
              <div className="space-y-2.5">
                {[
                  {
                    id: 't-5',
                    title: 'Conduct Live 1-on-1 Rooman Mentor Technical Simulation',
                    desc: 'Simulate 45-minute live coding round with mentor feedback.'
                  },
                  {
                    id: 't-6',
                    title: 'Prepare 5 STAR Technique Stories for Leadership & Conflict',
                    desc: 'Structure Situation, Task, Action, and measurable Results.'
                  }
                ].map((t) => (
                  <div
                    key={t.id}
                    onClick={() => toggleTask(t.id)}
                    className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition ${
                      completedTasks[t.id]
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-slate-900 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                        completedTasks[t.id]
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{t.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                  Week 4: Company Customization &amp; Final Clearance
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">Target: Offer Conversion</span>
              </div>
              <div className="space-y-2.5">
                {[
                  {
                    id: 't-7',
                    title: 'Tailor ATS Resume with 15+ Target Recruiter Keywords',
                    desc: 'Achieve ATS Compatibility score > 90% in AI validator.'
                  },
                  {
                    id: 't-8',
                    title: 'Attend Pre-Placement Talk (PPT) & Submit Attendance Confirmation',
                    desc: 'Mandatory prerequisite for online assessment link activation.'
                  }
                ].map((t) => (
                  <div
                    key={t.id}
                    onClick={() => toggleTask(t.id)}
                    className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition ${
                      completedTasks[t.id]
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-slate-900 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                        completedTasks[t.id]
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{t.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: AI Technical Mock Interview Simulator */}
      {activeSubTab === 'mock-interview' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          {/* Header & Mode Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <BrainCircuit className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>AI Technical &amp; Behavioral Mock Interview Simulator</span>
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  Gemini Flash AI
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Practice corporate interviews with multi-turn generative AI or single-question STAR analysis.
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setInterviewMode('interactive')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  interviewMode === 'interactive'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Live Multi-Turn Session
              </button>
              <button
                onClick={() => setInterviewMode('single')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  interviewMode === 'single'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Quick STAR Coach
              </button>
            </div>
          </div>

          {/* Configuration Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Recruiter</label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-hidden"
              >
                <option value="Rooman Technologies">Rooman Technologies</option>
                <option value="Google Cloud India">Google Cloud India</option>
                <option value="Cisco Systems">Cisco Systems</option>
                <option value="Deloitte USI">Deloitte USI</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Role</label>
              <input
                type="text"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Interview Round</label>
              <select
                value={interactiveRound}
                onChange={(e: any) => setInteractiveRound(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-hidden"
              >
                <option value="Technical & System Design">Technical &amp; System Design</option>
                <option value="Coding Logic & DSA">Coding Logic &amp; Algorithms</option>
                <option value="Managerial & Behavioral HR">Managerial &amp; Behavioral HR</option>
              </select>
            </div>
          </div>

          {/* MODE 1: INTERACTIVE MULTI-TURN AI INTERVIEW */}
          {interviewMode === 'interactive' && (
            <div className="space-y-4">
              {/* Error Banner */}
              {interactiveError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Interview Session Error</span>
                    <p className="font-mono text-[11px] mt-0.5">{interactiveError}</p>
                  </div>
                </div>
              )}

              {/* Empty State / Start Button */}
              {interactiveHistory.length === 0 && !isInteractiveLoading && (
                <div className="py-12 px-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-4">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Ready for Your Live {selectedCompany} Mock Interview?
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Gemini AI will act as your senior technical interviewer for <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedRole}</span>. It analyzes your answers and asks realistic follow-ups in real time.
                    </p>
                  </div>
                  <button
                    onClick={handleStartInteractiveInterview}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition inline-flex items-center space-x-2 cursor-pointer active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Begin Live Interview Round</span>
                  </button>
                </div>
              )}

              {/* Chat Thread */}
              {interactiveHistory.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Live Interview Thread ({selectedCompany} • {interactiveRound})
                    </span>
                    <button
                      onClick={handleResetInteractiveInterview}
                      className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs flex items-center space-x-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restart Round</span>
                    </button>
                  </div>

                  <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                    {interactiveHistory.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`space-y-2 ${
                          msg.role === 'interviewer' ? 'mr-6' : 'ml-6'
                        }`}
                      >
                        <div
                          className={`p-4 rounded-2xl text-xs space-y-1.5 shadow-2xs ${
                            msg.role === 'interviewer'
                              ? 'bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                              : 'bg-indigo-600 text-white ml-auto'
                          }`}
                        >
                          <div className="flex items-center justify-between pb-1 border-b border-black/5 dark:border-white/10">
                            <span className="font-bold text-[10px] uppercase tracking-wider">
                              {msg.role === 'interviewer' ? `Lead Interviewer (${selectedCompany})` : selectedStudent.name}
                            </span>
                            <span className="text-[10px] opacity-70">
                              {msg.role === 'interviewer' ? 'Gemini 2.5 Flash' : 'Candidate'}
                            </span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        </div>

                        {/* Instant STAR Feedback Card for Candidate Turn */}
                        {msg.feedback && (
                          <div className="p-3.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs space-y-2 animate-fade-in">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center space-x-1">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Turn STAR Analysis</span>
                              </span>
                              <span className="px-2 py-0.5 rounded text-[11px] font-black bg-indigo-600 text-white">
                                {msg.feedback.score} / 100
                              </span>
                            </div>

                            {msg.feedback.starEvaluation && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
                                <span className={`px-2 py-1 rounded text-center font-bold ${msg.feedback.starEvaluation.situationDetected ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-600'}`}>
                                  Situation: {msg.feedback.starEvaluation.situationDetected ? '✓ Detected' : 'Missing'}
                                </span>
                                <span className={`px-2 py-1 rounded text-center font-bold ${msg.feedback.starEvaluation.taskDetected ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-600'}`}>
                                  Task: {msg.feedback.starEvaluation.taskDetected ? '✓ Detected' : 'Missing'}
                                </span>
                                <span className={`px-2 py-1 rounded text-center font-bold ${msg.feedback.starEvaluation.actionDetected ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-600'}`}>
                                  Action: {msg.feedback.starEvaluation.actionDetected ? '✓ Detected' : 'Missing'}
                                </span>
                                <span className={`px-2 py-1 rounded text-center font-bold ${msg.feedback.starEvaluation.resultQuantified ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-600'}`}>
                                  Metrics: {msg.feedback.starEvaluation.resultQuantified ? '✓ Quantified' : 'Vague'}
                                </span>
                              </div>
                            )}

                            {msg.feedback.strengths && msg.feedback.strengths.length > 0 && (
                              <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                                <span className="font-bold">Strength: </span>{msg.feedback.strengths[0]}
                              </p>
                            )}
                            {msg.feedback.improvements && msg.feedback.improvements.length > 0 && (
                              <p className="text-[11px] text-indigo-900 dark:text-indigo-200">
                                <span className="font-bold">Recommendation: </span>{msg.feedback.improvements[0]}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {isInteractiveLoading && (
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs flex items-center space-x-3 text-slate-600 dark:text-slate-300 animate-pulse">
                        <div className="h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
                        <span>Lead Interviewer is analyzing your response and formulating the next challenge...</span>
                      </div>
                    )}
                  </div>

                  {/* Input Box */}
                  {!finalInterviewSummary && (
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Your Spoken / Technical Response
                        </label>
                        <span className="text-[10px] text-slate-400">
                          Structure with Situation, Task, Action, and Quantified Result
                        </span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <textarea
                          rows={3}
                          value={interactiveInput}
                          onChange={(e) => setInteractiveInput(e.target.value)}
                          placeholder="Speak or type your interview answer here..."
                          className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                              handleSendInteractiveAnswer();
                            }
                          }}
                        />
                        <button
                          onClick={handleSendInteractiveAnswer}
                          disabled={isInteractiveLoading || !interactiveInput.trim()}
                          className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 cursor-pointer shrink-0 transition"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Final Summary Verdict */}
                  {finalInterviewSummary && (
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
                      <div className="flex items-center space-x-2 text-emerald-900 dark:text-emerald-200 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Interview Round Completed</span>
                      </div>
                      <p className="text-emerald-800 dark:text-emerald-300 text-xs leading-relaxed">
                        {finalInterviewSummary}
                      </p>
                      <button
                        onClick={handleResetInteractiveInterview}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs transition"
                      >
                        Start Another Practice Round
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MODE 2: QUICK SINGLE-QUESTION STAR COACH */}
          {interviewMode === 'single' && (
            <div className="space-y-4">
              {evaluationError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Evaluation Error</span>
                    <p className="font-mono text-[11px] mt-0.5">{evaluationError}</p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Interview Question</label>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>{interviewQuestion}</span>
                  <button
                    onClick={() => {
                      const questions = [
                        'Describe how you designed the database schema in your capstone project to handle high-concurrency writes.',
                        'How do you explain the difference between processes and threads to a non-technical stakeholder?',
                        'Tell me about a time when a team member missed a critical milestone. How did you handle it?',
                        'Explain how you would optimize an algorithmic solution from O(N^2) to O(N log N).'
                      ];
                      const nextQ = questions[Math.floor(Math.random() * questions.length)];
                      setInterviewQuestion(nextQ);
                    }}
                    className="text-indigo-600 hover:text-indigo-800 text-[11px] font-bold flex items-center space-x-1 ml-3 shrink-0"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>New Question</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Your Answer (Use the STAR Technique: Situation, Task, Action, Result)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Tip: Quantify your results with latency, throughput, or accuracy numbers!
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={candidateAnswer}
                  onChange={(e) => setCandidateAnswer(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleEvaluateAnswer}
                  disabled={isEvaluating}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center space-x-2 transition cursor-pointer active:scale-95"
                >
                  {isEvaluating ? (
                    <>
                      <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Evaluating STAR Response...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Evaluate with Gemini AI</span>
                    </>
                  )}
                </button>
              </div>

              {/* AI Evaluation Output */}
              {interviewEvaluation && (
                <div className="mt-5 p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4 text-xs animate-fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-800 dark:text-white">
                      STAR Technique Rigor Score
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                      {interviewEvaluation.overallScore} / 100
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Situation</span>
                      <p className="text-[11px] text-slate-700 dark:text-slate-200 mt-1">{interviewEvaluation.starAnalysis?.situation}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Task</span>
                      <p className="text-[11px] text-slate-700 dark:text-slate-200 mt-1">{interviewEvaluation.starAnalysis?.task}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Action</span>
                      <p className="text-[11px] text-slate-700 dark:text-slate-200 mt-1">{interviewEvaluation.starAnalysis?.action}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Result</span>
                      <p className="text-[11px] text-slate-700 dark:text-slate-200 mt-1">{interviewEvaluation.starAnalysis?.result}</p>
                    </div>
                  </div>

                  {interviewEvaluation.improvedSampleAnswer && (
                    <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 text-slate-800 dark:text-slate-200 space-y-1">
                      <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 block">
                        Corporate Benchmark STAR Model Answer:
                      </span>
                      <p className="text-[11px] leading-relaxed text-indigo-950 dark:text-indigo-200">
                        "{interviewEvaluation.improvedSampleAnswer}"
                      </p>
                    </div>
                  )}

                  {interviewEvaluation.followUpQuestion && (
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 text-[11px]">
                      <span className="font-bold">Probable Follow-Up Question: </span>
                      {interviewEvaluation.followUpQuestion}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 3: AI ATS Resume Optimizer & 1-Click Tailorer */}
      {activeSubTab === 'ats-resume' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <FileCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>AI ATS Resume Optimizer &amp; JD Tailorer</span>
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  Google X-Y-Z Model
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically align student resume bullets with target JD requirements using Google's X-Y-Z formula.
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setResumeMode('tailor')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  resumeMode === 'tailor'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                1-Click JD Tailorer
              </button>
              <button
                onClick={() => setResumeMode('scan')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  resumeMode === 'scan'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                ATS Deep Scanner
              </button>
            </div>
          </div>

          {/* RESUME MODE 1: 1-CLICK TAILOR FOR TARGET DRIVE */}
          {resumeMode === 'tailor' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Target Recruiter Drive Alignment
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Select target corporate drive to engineer Google X-Y-Z formula bullets: "Accomplished [X] measured by [Y], by doing [Z]".
                  </p>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <select
                    value={targetDriveForTailor}
                    onChange={(e) => setTargetDriveForTailor(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:outline-hidden"
                  >
                    <option value="Rooman Technologies">Rooman Technologies</option>
                    <option value="Google Cloud India">Google Cloud India</option>
                    <option value="Cisco Systems">Cisco Systems</option>
                    <option value="Deloitte USI">Deloitte USI</option>
                  </select>
                  <button
                    onClick={handleTailorResume}
                    disabled={isTailoringResume}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center space-x-1.5 cursor-pointer active:scale-95"
                  >
                    {isTailoringResume ? (
                      <>
                        <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Tailoring...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Tailor Resume</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {tailorError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Resume Tailoring Error</span>
                    <p className="font-mono text-[11px] mt-0.5">{tailorError}</p>
                  </div>
                </div>
              )}

              {/* Tailored Result View */}
              {tailoredResume && (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4 text-xs animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Tailored Headline</span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {tailoredResume.tailoredHeadline}
                      </h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        {tailoredResume.projectedAtsMatchPercent}% Match
                      </span>
                      <button
                        onClick={handleCopyTailoredResume}
                        className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center space-x-1 cursor-pointer transition shadow-xs"
                      >
                        {resumeCopied ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Resume</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Tailored Executive Summary</span>
                    <p className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 leading-relaxed italic">
                      "{tailoredResume.tailoredSummary}"
                    </p>
                  </div>

                  {/* Projects in X-Y-Z formula */}
                  {tailoredResume.tailoredProjects && (
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Google X-Y-Z Re-Architected Bullets
                      </span>
                      <div className="space-y-2">
                        {tailoredResume.tailoredProjects.map((p: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5"
                          >
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 block">
                              {p.title}
                            </span>
                            <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                              • {p.tailoredBullet}
                            </p>
                            {p.highlightedKeywords && p.highlightedKeywords.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {p.highlightedKeywords.map((kw: string, kIdx: number) => (
                                  <span
                                    key={kIdx}
                                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300"
                                  >
                                    #{kw}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended skills */}
                  {tailoredResume.recommendedSkillsOrder && (
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Recommended Skills Order for ATS</span>
                      <div className="flex flex-wrap gap-1.5">
                        {tailoredResume.recommendedSkillsOrder.map((s: string, sIdx: number) => (
                          <span
                            key={sIdx}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TPO Statement */}
                  {tailoredResume.tpoReadyVerification && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-300 flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{tailoredResume.tpoReadyVerification}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* RESUME MODE 2: ATS DEEP SCANNER */}
          {resumeMode === 'scan' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Scan existing resume text against Tier-1 recruiting patterns.
                </span>
                <button
                  onClick={handleAnalyzeResume}
                  disabled={isAnalyzingResume}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center space-x-2 transition cursor-pointer active:scale-95"
                >
                  {isAnalyzingResume ? (
                    <>
                      <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Scanning ATS Index...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Run ATS Deep Scan</span>
                    </>
                  )}
                </button>
              </div>

              {atsScanError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">ATS Scan Error</span>
                    <p className="font-mono text-[11px] mt-0.5">{atsScanError}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Current ATS Score</span>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">
                    {resumeAnalysis?.atsScore || selectedStudent.resume?.atsScore || 85}
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-normal">/100</span>
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    ✓ Above 75% Campus Placement Threshold
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2 md:col-span-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Resume Summary Checked</span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
                    "{selectedStudent.resume?.summary || 'Computer science student seeking software engineering opportunities.'}"
                  </p>
                </div>
              </div>

              {/* ATS Improvement Recommendations */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Recommended Bullet Point Enhancements (Power Verbs + Metrics)
                </h4>

                <div className="space-y-3">
                  {[
                    {
                      original: 'Built a web application for booking appointments using React and Node.js.',
                      improved: 'Architected full-stack appointment platform in React & Node.js, reducing booking latency by 35% across 2,000+ daily sessions.',
                      rationale: 'Replaced passive verb with "Architected" and added quantifiable performance metrics.'
                    },
                    {
                      original: 'Worked on database queries and optimized performance.',
                      improved: 'Engineered composite PostgreSQL indexes and implemented Redis caching, cutting P95 database query response times by 48%.',
                      rationale: 'Specifies explicit tools (Redis, PostgreSQL) and P95 latency improvement.'
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs space-y-2">
                      <div className="flex items-start space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 shrink-0">
                          Before
                        </span>
                        <span className="text-slate-600 dark:text-slate-400 line-through">{item.original}</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 shrink-0">
                          After
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">{item.improved}</span>
                      </div>
                      <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium pl-14">
                        Why: {item.rationale}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 4: Multi-Metric Radar Diagnostic */}
      {activeSubTab === 'diagnostic' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Multi-Parameter Corporate Readiness Diagnostic
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200">1. Problem Solving (DSA)</span>
                <span className="font-black text-indigo-600 dark:text-indigo-400">{selectedStudent.leetcodeSolved} Solved</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${Math.min(100, (selectedStudent.leetcodeSolved / 350) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">Benchmark: 250+ Problems for Tier-1 Product Companies</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">2. Quantitative Aptitude</span>
                <span className="font-black text-indigo-600">{selectedStudent.aptitudeScore}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${selectedStudent.aptitudeScore}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">Benchmark: &gt;80% for Deloitte &amp; Rooman written rounds</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">3. Projects &amp; GitHub Rigor</span>
                <span className="font-black text-indigo-600">{selectedStudent.projects?.length || 2} Deployed</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${Math.min(100, (selectedStudent.projects?.length || 2) * 33)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">Benchmark: Min 2 Full-Stack or Systems Repos with Live Demos</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">4. Academic Credits (APAAR)</span>
                <span className="font-black text-indigo-600">
                  {selectedStudent.apaarRecord.totalCreditsEarned} / {selectedStudent.apaarRecord.totalCreditsRequired}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{
                    width: `${(selectedStudent.apaarRecord.totalCreditsEarned / selectedStudent.apaarRecord.totalCreditsRequired) * 100}%`
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-500">National Academic Depository &amp; DigiLocker Verified</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">5. Placement Training Attendance</span>
                <span
                  className={`font-black ${
                    selectedStudent.attendancePercent >= 75 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {selectedStudent.attendancePercent}%
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-2 rounded-full ${
                    selectedStudent.attendancePercent >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${selectedStudent.attendancePercent}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">Mandatory Placement Cell Minimum: 75%</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">6. Mock Technical Interview</span>
                <span className="font-black text-indigo-600">{selectedStudent.mockInterviewScore}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${selectedStudent.mockInterviewScore}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">Communication &amp; System Design Defense Score</p>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 5: AI GitHub Portfolio & Code Quality Auditor */}
      {activeSubTab === 'github-portfolio' && (
        <div className="space-y-6">
          {/* Header & Repo Input Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  <GitBranch className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <span>GitHub Code Quality &amp; Engineering Rigor Auditor</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      Gemini 2.5 Flash
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Deep structural audit of candidate repositories: design patterns, test coverage, code smells, and interview defense narrative.
                  </p>
                </div>
              </div>

              <button
                onClick={handleAuditPortfolio}
                disabled={isAuditingPortfolio}
                className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-2 shrink-0 transition cursor-pointer"
              >
                {isAuditingPortfolio ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Auditing Repositories...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Run Gemini Code Audit</span>
                  </>
                )}
              </button>
            </div>

            {/* Repository Input Field */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Terminal className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={customRepoUrl}
                  onChange={(e) => setCustomRepoUrl(e.target.value)}
                  placeholder="https://github.com/candidate/distributed-cache-engine (or leave blank to audit verified profile projects)"
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <span className="text-[11px] text-slate-400 shrink-0">
                Auditing: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedStudent.name}</span>
              </span>
            </div>

            {/* Error Message */}
            {portfolioAuditError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Gemini API Error: {portfolioAuditError}</span>
              </div>
            )}
          </div>

          {/* Portfolio Audit Results */}
          {portfolioAudit && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Top Score & Grade Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Engineering Rigor</span>
                    <Award className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="mt-2 flex items-baseline space-x-2">
                    <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                      {portfolioAudit.engineeringRigorScore}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">/ 100</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${portfolioAudit.engineeringRigorScore}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Code Quality Grade</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="mt-2">
                    <span className="inline-block px-3 py-1 rounded-xl text-sm font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {portfolioAudit.codeQualityGrade}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">Validated against enterprise code standards</p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Architectural Complexity</span>
                    <Layers className="w-4 h-4 text-purple-500" />
                  </div>
                  <p className="mt-2 text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                    {portfolioAudit.architecturalComplexity}
                  </p>
                </div>
              </div>

              {/* Strengths and Gaps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Top Engineering Strengths</span>
                  </h4>
                  <ul className="space-y-2">
                    {portfolioAudit.topStrengths?.map((strength: string, i: number) => (
                      <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Code Smells &amp; Production Gaps</span>
                  </h4>
                  <ul className="space-y-2">
                    {portfolioAudit.codeSmellsOrGaps?.map((smell: string, i: number) => (
                      <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span>{smell}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* CI/CD & Interview Pitch */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center space-x-2">
                    <FileCode className="w-4 h-4" />
                    <span>CI/CD &amp; Test Coverage Assessment</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-950 p-3 rounded-xl border border-slate-800">
                    {portfolioAudit.testCoverageAndCiCdAssessment}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white rounded-2xl p-5 border border-indigo-800/50 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Recruiter Technical Pitch (Elevator Defense)</span>
                  </h4>
                  <p className="text-xs text-slate-200 leading-relaxed italic bg-white/5 p-3 rounded-xl border border-white/10">
                    "{portfolioAudit.recruiterInterviewPitch}"
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Use this concise script when an interviewer asks: "Tell me about your most technically challenging project."
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
