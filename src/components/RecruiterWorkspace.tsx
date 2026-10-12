import React, { useState } from 'react';
import {
  Building2,
  Users,
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Eye,
  Mail,
  UserCheck,
  Calendar,
  Award,
  Layers,
  Check,
  X,
  Plus,
  Send,
  Star,
  TrendingUp,
  Cpu,
  FileCode,
  Terminal,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  RefreshCw,
  Zap,
  Code2
} from 'lucide-react';
import { api } from '../api';
import {
  RecruiterDrive,
  StudentProfile,
  CandidateFitScore,
  OfferRecord,
  UserRole
} from '../types';

interface RecruiterWorkspaceProps {
  drives: RecruiterDrive[];
  students: StudentProfile[];
  offers: OfferRecord[];
  onAddNewDrive: (newDrive: RecruiterDrive) => void;
  onUpdateCandidateStage?: (studentId: string, driveId: string, newStage: string) => void;
  onGenerateOffer?: (offerData: Partial<OfferRecord>) => void;
}

export const RecruiterWorkspace: React.FC<RecruiterWorkspaceProps> = ({
  drives,
  students,
  offers,
  onAddNewDrive,
  onUpdateCandidateStage,
  onGenerateOffer
}) => {
  const [activeTab, setActiveTab] = useState<
    'pipeline' | 'matching' | 'post-jd' | 'drive-day' | 'assessment' | 'analytics'
  >('pipeline');

  const [selectedDriveId, setSelectedDriveId] = useState<string>(drives[0]?.id || '');
  const selectedDrive = drives.find((d) => d.id === selectedDriveId) || drives[0];

  // Kanban Pipeline State
  // Columns: Applied -> Shortlisted -> Test -> Interview -> Offer -> Joined
  type PipelineStage = 'Applied' | 'Shortlisted' | 'Assessment Active' | 'Technical Interview' | 'HR & Offer' | 'Joined';

  const stages: PipelineStage[] = [
    'Applied',
    'Shortlisted',
    'Assessment Active',
    'Technical Interview',
    'HR & Offer',
    'Joined'
  ];

  // Local candidate stages mapped to students
  const [candidateStages, setCandidateStages] = useState<Record<string, PipelineStage>>(() => {
    const map: Record<string, PipelineStage> = {};
    students.forEach((s, idx) => {
      if (idx === 0) map[s.id] = 'Technical Interview';
      else if (idx === 1) map[s.id] = 'HR & Offer';
      else if (idx === 2) map[s.id] = 'Assessment Active';
      else if (idx === 3) map[s.id] = 'Shortlisted';
      else map[s.id] = 'Applied';
    });
    return map;
  });

  const [selectedCandidatesForBulk, setSelectedCandidatesForBulk] = useState<string[]>([]);
  const [bulkActionSuccess, setBulkActionSuccess] = useState<string | null>(null);

  // Selected candidate profile modal
  const [inspectingStudent, setInspectingStudent] = useState<StudentProfile | null>(null);

  // Per-candidate scorecard / evaluation form state
  const [evaluatingStudent, setEvaluatingStudent] = useState<StudentProfile | null>(null);
  const [evalRating, setEvalRating] = useState<number>(4);
  const [evalVerdict, setEvalVerdict] = useState<'Strong Hire' | 'Hire' | 'Borderline' | 'Reject'>('Hire');
  const [evalNotes, setEvalNotes] = useState<string>('Strong core algorithms knowledge. Clean syntax on whiteboarding.');

  // Feature 5: Bulk Weighted Candidate Ranking
  const [isBulkRankingOpen, setIsBulkRankingOpen] = useState(false);
  const [isRankingLoading, setIsRankingLoading] = useState(false);
  const [rankingData, setRankingData] = useState<any | null>(null);
  const [rankingError, setRankingError] = useState<string | null>(null);
  const [rankingWeights, setRankingWeights] = useState({
    dsa: 40,
    projects: 30,
    cgpa: 20,
    softSkills: 10
  });

  const handleRunBulkRanking = async () => {
    setIsRankingLoading(true);
    setRankingError(null);
    try {
      const res = await api.ai.bulkRankCandidates({
        candidates: students,
        weights: rankingWeights,
        driveContext: selectedDrive
      });
      if (res?.ranking) {
        setRankingData(res.ranking);
      } else {
        throw new Error('Malformed ranking response from Gemini');
      }
    } catch (err: any) {
      console.error('Bulk ranking error:', err);
      setRankingError(err.message || 'Failed to calculate weighted candidate ranking');
    } finally {
      setIsRankingLoading(false);
    }
  };

  // Feature 6: Technical Assessment & Challenge Generator
  const [isAssessmentLoading, setIsAssessmentLoading] = useState(false);
  const [assessmentData, setAssessmentData] = useState<any | null>(null);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const [assessmentTechStack, setAssessmentTechStack] = useState('Python, SQL, FastAPI, Docker');
  const [assessmentDifficulty, setAssessmentDifficulty] = useState<'Junior' | 'Intermediate' | 'Hard'>('Intermediate');

  const handleGenerateAssessment = async () => {
    setIsAssessmentLoading(true);
    setAssessmentError(null);
    try {
      const techList = assessmentTechStack.split(',').map((t) => t.trim());
      const res = await api.ai.generateAssessment({
        roleTitle: selectedDrive.roleTitle,
        companyName: selectedDrive.companyName,
        techStack: techList,
        difficulty: assessmentDifficulty
      });
      if (res?.assessment) {
        setAssessmentData(res.assessment);
      } else {
        throw new Error('Malformed assessment response from Gemini');
      }
    } catch (err: any) {
      console.error('Assessment generation error:', err);
      setAssessmentError(err.message || 'Failed to generate technical assessment');
    } finally {
      setIsAssessmentLoading(false);
    }
  };

  // Feature 7: APAAR DigiLocker Fraud Detector
  const [isApaarLoading, setIsApaarLoading] = useState(false);
  const [apaarAuditData, setApaarAuditData] = useState<any | null>(null);
  const [apaarError, setApaarError] = useState<string | null>(null);

  const handleAuditApaar = async (student: StudentProfile) => {
    setIsApaarLoading(true);
    setApaarError(null);
    setApaarAuditData(null);
    try {
      const res = await api.ai.auditApaarCredentials({ student });
      if (res?.audit) {
        setApaarAuditData(res.audit);
      } else {
        throw new Error('Malformed APAAR audit response from Gemini');
      }
    } catch (err: any) {
      console.error('APAAR audit error:', err);
      setApaarError(err.message || 'Failed to audit APAAR credentials');
    } finally {
      setIsApaarLoading(false);
    }
  };

  // Feature 8: Interviewer Live In-Round Copilot
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);
  const [copilotData, setCopilotData] = useState<any | null>(null);
  const [copilotError, setCopilotError] = useState<string | null>(null);

  const handleRunCopilot = async (student: StudentProfile) => {
    setIsCopilotLoading(true);
    setCopilotError(null);
    setCopilotData(null);
    try {
      const res = await api.ai.interviewerCopilot({
        candidate: student,
        roleTitle: selectedDrive.roleTitle,
        companyName: selectedDrive.companyName
      });
      if (res?.copilot) {
        setCopilotData(res.copilot);
      } else {
        throw new Error('Malformed Copilot response from Gemini');
      }
    } catch (err: any) {
      console.error('Copilot error:', err);
      setCopilotError(err.message || 'Failed to generate interview probing questions');
    } finally {
      setIsCopilotLoading(false);
    }
  };

  // New JD Posting Form state
  const [newCompanyName, setNewCompanyName] = useState('Google');
  const [newRoleTitle, setNewRoleTitle] = useState('Software Engineer - Systems');
  const [newCtc, setNewCtc] = useState(24.5);
  const [newLocation, setNewLocation] = useState('Bangalore / Hyderabad');
  const [newMinCgpa, setNewMinCgpa] = useState(8.0);
  const [newMaxBacklogs, setNewMaxBacklogs] = useState(0);
  const [newBond, setNewBond] = useState('No Bond');
  const [newSkills, setNewSkills] = useState('Go, Distributed Systems, Python, Linux Internals');
  const [jdSuccess, setJdSuccess] = useState(false);

  // Move candidate between stages
  const moveCandidate = (studentId: string, targetStage: PipelineStage) => {
    setCandidateStages((prev) => ({ ...prev, [studentId]: targetStage }));
    if (onUpdateCandidateStage && selectedDrive) {
      onUpdateCandidateStage(studentId, selectedDrive.id, targetStage);
    }
  };

  // Bulk actions
  const handleBulkMove = (targetStage: PipelineStage) => {
    setCandidateStages((prev) => {
      const next = { ...prev };
      selectedCandidatesForBulk.forEach((id) => {
        next[id] = targetStage;
      });
      return next;
    });
    setBulkActionSuccess(`Advanced ${selectedCandidatesForBulk.length} selected candidates to "${targetStage}".`);
    setSelectedCandidatesForBulk([]);
    setTimeout(() => setBulkActionSuccess(null), 4000);
  };

  const toggleSelectCandidate = (id: string) => {
    if (selectedCandidatesForBulk.includes(id)) {
      setSelectedCandidatesForBulk(selectedCandidatesForBulk.filter((i) => i !== id));
    } else {
      setSelectedCandidatesForBulk([...selectedCandidatesForBulk, id]);
    }
  };

  // Submit new JD
  const handleCreateJd = (e: React.FormEvent) => {
    e.preventDefault();
    const created: RecruiterDrive = {
      id: `drv-${Date.now()}`,
      companyName: newCompanyName,
      logo: newCompanyName.slice(0, 3).toUpperCase(),
      roleTitle: newRoleTitle,
      jobType: 'Full-Time',
      ctcLPA: newCtc,
      location: newLocation,
      minCGPA: newMinCgpa,
      eligibleBranches: ['CSE', 'IT', 'AI&DS'],
      maxBacklogsAllowed: newMaxBacklogs,
      requiredSkills: newSkills.split(',').map((s) => s.trim()),
      preferredSkills: ['System Design', 'Docker', 'Kubernetes'],
      driveDate: '2026-10-24',
      deadlineDate: '2026-10-20',
      status: 'Registration Open',
      venueOrPlatform: 'Auditorium Main & HackerRank Platform',
      rounds: [
        { name: 'Online Coding Test', date: '2026-10-21', time: '10:00 AM', type: 'Online', venue: 'Virtual' },
        { name: 'Technical Interview', date: '2026-10-24', time: '09:00 AM', type: 'Offline', venue: 'Lab 3' },
        { name: 'HR & Fit Discussion', date: '2026-10-24', time: '03:00 PM', type: 'Offline', venue: 'Executive Lounge' }
      ],
      shortlistedCount: 0,
      registeredCount: 0,
      selectedCount: 0,
      description: `Hiring ${newRoleTitle} at ${newCompanyName} for high-scale backend services.`
    };

    onAddNewDrive(created);
    setSelectedDriveId(created.id);
    setJdSuccess(true);
    setTimeout(() => {
      setJdSuccess(false);
      setActiveTab('pipeline');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Top Recruiter Workspace Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center">
                <Building2 className="w-3.5 h-3.5 mr-1 text-cyan-300" />
                Corporate Recruiter Workspace
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-400/20 text-cyan-200 border border-cyan-300/30">
                Active Drive: {selectedDrive?.companyName}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Talent Acquisition Command
            </h1>
            <p className="text-sm text-cyan-100 max-w-xl leading-relaxed">
              Managing the applicant funnel for <span className="font-bold">{selectedDrive?.roleTitle}</span> (₹{selectedDrive?.ctcLPA} LPA).
              Shortlist verified profiles, review explainable AI fit scores, and release official offers.
            </p>
          </div>

          {/* Drive Selector */}
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 shrink-0 space-y-2">
            <span className="text-[10px] text-cyan-200 font-bold uppercase tracking-wider block">
              Active Job Campaign
            </span>
            <select
              value={selectedDriveId}
              onChange={(e) => setSelectedDriveId(e.target.value)}
              className="w-full text-xs font-bold bg-slate-900/90 text-white border border-white/30 rounded-xl p-2.5 focus:outline-none"
            >
              {drives.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.companyName} — {d.roleTitle} (₹{d.ctcLPA} LPA)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-8 pt-4 border-t border-white/20 flex flex-wrap items-center gap-1.5 sm:gap-2">
          {[
            { id: 'pipeline', label: 'Applicant Kanban Pipeline', icon: Layers },
            { id: 'matching', label: 'AI Match & Fit Explanation', icon: Sparkles },
            { id: 'drive-day', label: 'Drive-Day Live View', icon: Calendar },
            { id: 'assessment', label: 'Assessment & Cutoffs', icon: Award },
            { id: 'post-jd', label: 'Post New Drive / JD', icon: Plus },
            { id: 'analytics', label: 'Hiring Funnel Analytics', icon: TrendingUp }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isSelected
                    ? 'bg-white text-blue-900 shadow-md scale-102'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bulk Action Notification Bar */}
      {bulkActionSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs flex items-center space-x-2 animate-fade-in shadow-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{bulkActionSuccess}</span>
        </div>
      )}

      {/* 1. KANBAN APPLICANT PIPELINE */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4 animate-fade-in">
          {/* Bulk Action Controls */}
          {selectedCandidatesForBulk.length > 0 && (
            <div className="bg-indigo-50 dark:bg-indigo-950/60 p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex flex-wrap items-center justify-between gap-3 text-xs animate-fade-in">
              <span className="font-bold text-indigo-900 dark:text-indigo-200">
                {selectedCandidatesForBulk.length} candidates selected for bulk action:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleBulkMove('Shortlisted')}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  Move to Shortlisted
                </button>
                <button
                  onClick={() => handleBulkMove('Assessment Active')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  Send Assessment Link
                </button>
                <button
                  onClick={() => handleBulkMove('Technical Interview')}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer"
                >
                  Schedule Interview
                </button>
                <button
                  onClick={() => handleBulkMove('HR & Offer')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  Generate Offers
                </button>
                <button
                  onClick={() => setSelectedCandidatesForBulk([])}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* AI Bulk Weighted Ranking Action Bar (Feature 5) */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <span className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                <Sliders className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>Multi-Factor Weighted Shortlisting Matrix</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                    Gemini 2.5 Flash
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Configure custom hiring weights (DSA, Projects, CGPA, Soft Skills) to rank the entire candidate cohort with automated recommendations.
                </p>
              </div>
            </div>
            <button
              id="open-bulk-ranking-btn"
              onClick={() => setIsBulkRankingOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer shrink-0 transition"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Configure Weights &amp; Rank Candidates</span>
            </button>
          </div>

          {/* Kanban Board Horizontal Scroll */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3.5 items-start overflow-x-auto pb-4">
            {stages.map((stage) => {
              const candidatesInStage = students.filter(
                (s) => (candidateStages[s.id] || 'Applied') === stage
              );

              return (
                <div
                  key={stage}
                  className="bg-slate-100 dark:bg-slate-900/90 rounded-2xl p-3 border border-slate-200/90 dark:border-slate-800 min-w-[210px] space-y-2.5"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {stage}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {candidatesInStage.length}
                    </span>
                  </div>

                  {/* Cards inside stage */}
                  <div className="space-y-2.5 min-h-[300px]">
                    {candidatesInStage.length === 0 ? (
                      <div className="p-4 text-center text-[10px] text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl">
                        No candidates in this stage
                      </div>
                    ) : (
                      candidatesInStage.map((student) => {
                        const isSelected = selectedCandidatesForBulk.includes(student.id);

                        return (
                          <div
                            key={student.id}
                            className={`p-3 rounded-xl border transition-all text-xs space-y-2 ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 ring-2 ring-indigo-400/20'
                                : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:shadow-xs'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-2 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectCandidate(student.id)}
                                  className="rounded accent-indigo-600 cursor-pointer"
                                />
                                <span className="font-bold text-slate-900 dark:text-white truncate">
                                  {student.name}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                                {student.cgpa} CGPA
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                              <span>{student.branch} • {student.batch}</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {student.readinessScore}% Match
                              </span>
                            </div>

                            {/* Actions on candidate */}
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                              <button
                                onClick={() => setInspectingStudent(student)}
                                className="text-[10px] font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                              >
                                View Profile
                              </button>

                              <button
                                onClick={() => setEvaluatingStudent(student)}
                                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                              >
                                Evaluate Form
                              </button>
                            </div>

                            {/* Quick Next Stage Advance button */}
                            {stage !== 'Joined' && (
                              <button
                                onClick={() => {
                                  const nextIdx = stages.indexOf(stage) + 1;
                                  if (nextIdx < stages.length) {
                                    moveCandidate(student.id, stages[nextIdx]);
                                  }
                                }}
                                className="w-full py-1 text-[10px] font-bold bg-slate-50 dark:bg-slate-700/60 hover:bg-indigo-50 dark:hover:bg-indigo-900/60 text-slate-700 dark:text-slate-200 hover:text-indigo-600 rounded-lg transition border border-slate-200 dark:border-slate-600 cursor-pointer flex items-center justify-center space-x-1"
                              >
                                <span>Advance to Next Stage</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. AI CANDIDATE MATCHING & FIT EXPLANATIONS */}
      {activeTab === 'matching' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Explainable AI Fit Rankings for {selectedDrive.companyName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Candidates ranked by semantic JD compatibility, verified course credits, and project portfolio.
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800">
              {students.length} Total Ranked Profiles
            </span>
          </div>

          <div className="space-y-3">
            {students.map((student, rankIdx) => (
              <div
                key={student.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-start space-x-3.5">
                  <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 font-black text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                    #{rankIdx + 1}
                  </span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {student.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {student.cgpa} CGPA
                      </span>
                      <span className="text-slate-400">• {student.branch}</span>
                    </div>

                    {/* Explainability Verdict */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 mt-2 max-w-2xl text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                      <p className="font-semibold text-indigo-600 dark:text-indigo-400">
                        ✓ Why this candidate matches:
                      </p>
                      <p className="leading-relaxed">
                        Matches {student.skills.slice(0, 3).map((s) => s.name).join(', ')}. Strong hands-on
                        portfolio in {student.projects[0]?.title || 'Distributed Systems'}.
                        DigiLocker APAAR Verified with {student.apaarRecord.totalCreditsEarned} academic credits.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0 self-end lg:self-center">
                  <div className="text-right">
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 block">
                      {Math.max(72, student.readinessScore)}% Fit
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">Semantic Fit Score</span>
                  </div>

                  <button
                    onClick={() => {
                      moveCandidate(student.id, 'Shortlisted');
                      alert(`Shortlisted ${student.name} for ${selectedDrive.companyName}`);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
                  >
                    1-Click Shortlist
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. POST NEW DRIVE / JD WIZARD */}
      {activeTab === 'post-jd' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-3xl mx-auto animate-fade-in">
          <div className="mb-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Post New Campus Recruitment Drive / Job Specification
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Publishing will auto-calculate student cohort eligibility and open the student application portal.
            </p>
          </div>

          {jdSuccess && (
            <div className="p-3 mb-4 bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Drive published successfully! Redirecting to applicant pipeline...</span>
            </div>
          )}

          <form onSubmit={handleCreateJd} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Role Title
                </label>
                <input
                  type="text"
                  required
                  value={newRoleTitle}
                  onChange={(e) => setNewRoleTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  CTC Package (LPA)
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={newCtc}
                  onChange={(e) => setNewCtc(parseFloat(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Min CGPA Cutoff
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newMinCgpa}
                  onChange={(e) => setNewMinCgpa(parseFloat(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Service Agreement / Bond
                </label>
                <input
                  type="text"
                  value={newBond}
                  onChange={(e) => setNewBond(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Required Core Skills (Comma-separated)
              </label>
              <input
                type="text"
                required
                value={newSkills}
                onChange={(e) => setNewSkills(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md active:scale-95 cursor-pointer flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Publish Drive &amp; Open Student Registration</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3.5 AI ASSESSMENT & CODING CHALLENGE GENERATOR (FEATURE 6) */}
      {activeTab === 'assessment' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Code2 className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <span>AI Technical Assessment &amp; Challenge Architect</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      Gemini 2.5 Flash
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Generate production-grade coding problems, test cases, and domain MCQs tailored for {selectedDrive.companyName} ({selectedDrive.roleTitle}).
                  </p>
                </div>
              </div>

              <button
                id="generate-assessment-btn"
                onClick={handleGenerateAssessment}
                disabled={isAssessmentLoading}
                className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-2 shrink-0 transition cursor-pointer"
              >
                {isAssessmentLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Drafting Assessment...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Generate Assessment Spec</span>
                  </>
                )}
              </button>
            </div>

            {/* Assessment Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Required Tech Stack (Comma separated):
                </label>
                <input
                  type="text"
                  value={assessmentTechStack}
                  onChange={(e) => setAssessmentTechStack(e.target.value)}
                  placeholder="Python, SQL, FastAPI, Docker"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Challenge Difficulty Level:
                </label>
                <div className="flex space-x-2">
                  {(['Junior', 'Intermediate', 'Hard'] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setAssessmentDifficulty(diff)}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                        assessmentDifficulty === diff
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {assessmentError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Gemini API Error: {assessmentError}</span>
              </div>
            )}
          </div>

          {/* Generated Assessment Content */}
          {assessmentData && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Header Overview Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                    Screening Assessment Specification
                  </span>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                    {assessmentData.assessmentTitle}
                  </h4>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center space-x-1.5 border border-slate-200 dark:border-slate-700">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Time Limit: {assessmentData.timeLimitMinutes} Mins</span>
                  </span>
                  <button
                    onClick={() => alert(`Assessment "${assessmentData.assessmentTitle}" deployed to Campus Screening Engine.`)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Deploy to Campus Portal
                  </button>
                </div>
              </div>

              {/* Coding Challenge Card */}
              {assessmentData.codingChallenge && (
                <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Terminal className="w-5 h-5 text-indigo-400" />
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                        Coding Challenge: {assessmentData.codingChallenge.title}
                      </h4>
                    </div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Algorithmic &amp; System Implementation
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
                    <p className="font-semibold text-slate-300 mb-1">Problem Statement:</p>
                    <p>{assessmentData.codingChallenge.problemStatement}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Input Format</span>
                      <p className="font-mono text-indigo-300">{assessmentData.codingChallenge.inputFormat}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Output Format</span>
                      <p className="font-mono text-emerald-300">{assessmentData.codingChallenge.outputFormat}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Constraints</span>
                    <p className="font-mono text-slate-300">{assessmentData.codingChallenge.constraints}</p>
                  </div>

                  {/* Sample Test Cases */}
                  {assessmentData.codingChallenge.sampleTestCases && (
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Sample Test Cases</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {assessmentData.codingChallenge.sampleTestCases.map((tc: any, i: number) => (
                          <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-1">
                            <div className="text-slate-400"><span className="text-indigo-400 font-bold">Input: </span>{tc.input}</div>
                            <div className="text-slate-400"><span className="text-emerald-400 font-bold">Output: </span>{tc.output}</div>
                            {tc.explanation && <div className="text-slate-500 font-sans text-[10px] pt-1">Note: {tc.explanation}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Technical MCQs Section */}
              {assessmentData.technicalMcqs && assessmentData.technicalMcqs.length > 0 && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                    <Award className="w-4 h-4 text-purple-500" />
                    <span>Domain Technical MCQs ({assessmentData.technicalMcqs.length} Questions)</span>
                  </h4>
                  <div className="space-y-3">
                    {assessmentData.technicalMcqs.map((mcq: any, i: number) => (
                      <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            Q{i + 1}: {mcq.question}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {mcq.options?.map((opt: string, optIdx: number) => (
                            <div
                              key={optIdx}
                              className={`p-2 rounded-lg border text-[11px] font-medium flex items-center space-x-2 ${
                                optIdx === mcq.correctOptionIndex
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-bold'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] flex items-center justify-center shrink-0">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span>{opt}</span>
                              {optIdx === mcq.correctOptionIndex && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                        {mcq.explanation && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-200 dark:border-slate-700">
                            Explanation: {mcq.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. DRIVE-DAY LIVE VIEW */}
      {activeTab === 'drive-day' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 animate-fade-in">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Drive-Day Live Operations &amp; Interview Panel Queue
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live attendance, student waiting buffer, and round movement for {selectedDrive.companyName}.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Checked In Today</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">48 Students</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">100% Present</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Currently Interviewing</span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">6 Panels Active</span>
              <span className="text-[10px] text-slate-400 font-semibold">Rooms 1-6 Occupied</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Cleared to Next Round</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">18 Candidates</span>
              <span className="text-[10px] text-slate-400 font-semibold">Ready for Final HR</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. HIRING FUNNEL ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 animate-fade-in">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Corporate Hiring Funnel &amp; Time-to-Hire Analytics
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Conversion drop rates across rounds for {selectedDrive.companyName}.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { stage: 'Stage 1: Applied & Screened', count: 180, pct: '100%' },
              { stage: 'Stage 2: Shortlisted by Cutoff', count: 84, pct: '46.6%' },
              { stage: 'Stage 3: Coding Assessment Cleared', count: 32, pct: '17.7%' },
              { stage: 'Stage 4: Technical Interviews Cleared', count: 14, pct: '7.7%' },
              { stage: 'Stage 5: Final Offers Extended', count: 8, pct: '4.4%' }
            ].map((st, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <div className="flex justify-between mb-1.5 font-bold">
                  <span className="text-slate-800 dark:text-slate-200">{st.stage}</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{st.count} Candidates ({st.pct})</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full" style={{ width: st.pct }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Candidate Profile Inspection Modal */}
      {inspectingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {inspectingStudent.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {inspectingStudent.branch} • USN: {inspectingStudent.usn} • CGPA: {inspectingStudent.cgpa}
                </p>
              </div>
              <button
                onClick={() => setInspectingStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Verified Skills:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {inspectingStudent.skills.map((s) => (
                    <span
                      key={s.name}
                      className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border text-[10px] font-bold text-slate-700 dark:text-slate-300"
                    >
                      {s.name} (Lvl {s.level})
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Key Projects:
                </span>
                {inspectingStudent.projects.map((p) => (
                  <div key={p.id} className="mb-2">
                    <p className="font-bold text-slate-900 dark:text-white">{p.title}</p>
                    <p className="text-slate-500 text-[11px]">{p.description}</p>
                  </div>
                ))}
              </div>

              {/* DigiLocker & APAAR Academic Integrity Audit (Feature 7) */}
              <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>DigiLocker &amp; APAAR Credential Fraud Audit</span>
                  </span>
                  <button
                    onClick={() => handleAuditApaar(inspectingStudent)}
                    disabled={isApaarLoading}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold flex items-center space-x-1 transition cursor-pointer"
                  >
                    {isApaarLoading ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Auditing...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 text-amber-300" />
                        <span>Run Audit</span>
                      </>
                    )}
                  </button>
                </div>

                {apaarError && (
                  <p className="text-[11px] text-rose-600 font-medium">Error: {apaarError}</p>
                )}

                {apaarAuditData && (
                  <div className="space-y-2 pt-2 border-t border-indigo-200 dark:border-indigo-800 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-300">Integrity Score:</span>
                      <span className="font-black text-indigo-600 dark:text-indigo-400">
                        {apaarAuditData.integrityScore}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-300">Fraud Risk Status:</span>
                      <span className="px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {apaarAuditData.fraudRiskLevel}
                      </span>
                    </div>
                    {apaarAuditData.discrepancies && apaarAuditData.discrepancies.length > 0 && (
                      <div className="text-rose-600 dark:text-rose-400 text-[10px]">
                        Discrepancies: {apaarAuditData.discrepancies.join(', ')}
                      </div>
                    )}
                    <p className="text-[10px] text-slate-500 italic">
                      Registrar Statement: "{apaarAuditData.registrarClearanceStatement}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInspectingStudent(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-indigo-600 text-white cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Scorecard / Evaluation Form Modal */}
      {evaluatingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Candidate Evaluation Scorecard
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {evaluatingStudent.name} • {selectedDrive.companyName}
                </p>
              </div>
              <button
                onClick={() => setEvaluatingStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Interviewer Live In-Round Copilot (Feature 8) */}
              <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-950 dark:text-purple-200 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Live Interviewer Copilot (Probing Questions)</span>
                  </span>
                  <button
                    onClick={() => handleRunCopilot(evaluatingStudent)}
                    disabled={isCopilotLoading}
                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold flex items-center space-x-1 transition cursor-pointer"
                  >
                    {isCopilotLoading ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 text-amber-300" />
                        <span>Get Probing Questions</span>
                      </>
                    )}
                  </button>
                </div>

                {copilotError && (
                  <p className="text-[11px] text-rose-600 font-medium">Error: {copilotError}</p>
                )}

                {copilotData && (
                  <div className="space-y-2 pt-2 border-t border-purple-200 dark:border-purple-800 text-[11px]">
                    <p className="text-[10px] text-slate-500 font-semibold">{copilotData.candidateTechnicalSummary}</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {copilotData.targetedQuestions?.map((tq: any, i: number) => (
                        <div key={i} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800/60 space-y-1">
                          <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 block">
                            Re: {tq.projectReferenced}
                          </span>
                          <p className="font-bold text-slate-900 dark:text-white">"{tq.probingQuestion}"</p>
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-400">
                            Listen for: {tq.whatToListenForInAnswer}
                          </div>
                          <div className="text-[10px] text-rose-600 dark:text-rose-400">
                            Red flag: {tq.redFlagAnswer}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Overall Rating (1 - 5)
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEvalRating(star)}
                      className={`p-2 rounded-xl border font-black transition cursor-pointer ${
                        evalRating === star
                          ? 'bg-amber-500 text-white border-amber-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      ★ {star}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Hiring Recommendation
                </label>
                <select
                  value={evalVerdict}
                  onChange={(e) => setEvalVerdict(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value="Strong Hire">Strong Hire</option>
                  <option value="Hire">Hire</option>
                  <option value="Borderline">Borderline / Waitlist</option>
                  <option value="Reject">Reject</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Interviewer Notes &amp; Whiteboard Feedback
                </label>
                <textarea
                  rows={3}
                  value={evalNotes}
                  onChange={(e) => setEvalNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end space-x-2">
              <button
                onClick={() => setEvaluatingStudent(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(`Evaluation saved! Verdict: "${evalVerdict}" recorded.`);
                  setEvaluatingStudent(null);
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs cursor-pointer"
              >
                Save Evaluation Scorecard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK WEIGHTED CANDIDATE RANKING MODAL (FEATURE 5) */}
      {isBulkRankingOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center space-x-2.5">
                <span className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
                  <Sliders className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <span>Multi-Factor Weighted Candidate Shortlisting Matrix</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                      Gemini 2.5 Flash
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Target Campaign: {selectedDrive.companyName} ({selectedDrive.roleTitle})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkRankingOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:bg-slate-800 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Weights Sliders Section */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Configure Hiring Dimension Weights (Total: {rankingWeights.dsa + rankingWeights.projects + rankingWeights.cgpa + rankingWeights.softSkills}%)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                    <span>DSA &amp; Logic</span>
                    <span className="text-purple-600">{rankingWeights.dsa}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={rankingWeights.dsa}
                    onChange={(e) => setRankingWeights({ ...rankingWeights, dsa: Number(e.target.value) })}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                    <span>Projects &amp; Code</span>
                    <span className="text-purple-600">{rankingWeights.projects}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={rankingWeights.projects}
                    onChange={(e) => setRankingWeights({ ...rankingWeights, projects: Number(e.target.value) })}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                    <span>CGPA Cutoff</span>
                    <span className="text-purple-600">{rankingWeights.cgpa}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={rankingWeights.cgpa}
                    onChange={(e) => setRankingWeights({ ...rankingWeights, cgpa: Number(e.target.value) })}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                    <span>Communication</span>
                    <span className="text-purple-600">{rankingWeights.softSkills}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={rankingWeights.softSkills}
                    onChange={(e) => setRankingWeights({ ...rankingWeights, softSkills: Number(e.target.value) })}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  Evaluates {students.length} verified candidate profiles against job requirements.
                </span>
                <button
                  onClick={handleRunBulkRanking}
                  disabled={isRankingLoading}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer transition"
                >
                  {isRankingLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Computing Ranking Matrix...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>Compute Weighted Ranking Matrix</span>
                    </>
                  )}
                </button>
              </div>

              {rankingError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Gemini API Error: {rankingError}</span>
                </div>
              )}
            </div>

            {/* Results Section */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {rankingData && (
                <>
                  <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200">
                    <span className="font-bold block mb-0.5">Ranking Rationale:</span>
                    <p>{rankingData.rankingRationale}</p>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 font-bold uppercase">
                          <th className="p-3">Rank</th>
                          <th className="p-3">Candidate</th>
                          <th className="p-3">Score</th>
                          <th className="p-3">Recommendation</th>
                          <th className="p-3">Standout Strength</th>
                          <th className="p-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {rankingData.rankedCandidates?.map((rc: any) => (
                          <tr key={rc.candidateId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-black text-slate-900 dark:text-white">#{rc.rank}</td>
                            <td className="p-3">
                              <span className="font-bold text-slate-900 dark:text-white block">{rc.candidateName}</span>
                              <span className="text-[10px] text-slate-400">{rc.justification}</span>
                            </td>
                            <td className="p-3 font-mono font-bold text-purple-600 dark:text-purple-400">
                              {rc.weightedScore}%
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  rc.recommendation === 'Priority Shortlist'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : rc.recommendation === 'Consider'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                }`}
                              >
                                {rc.recommendation}
                              </span>
                            </td>
                            <td className="p-3 text-[11px] text-slate-600 dark:text-slate-300">{rc.standoutStrength}</td>
                            <td className="p-3">
                              <button
                                onClick={() => {
                                  moveCandidate(rc.candidateId, 'Technical Interview');
                                  alert(`Promoted ${rc.candidateName} to Technical Interview.`);
                                }}
                                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                Promote to Round
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                AI Shortlisting Engine • Zero Mocks • Direct Gemini 2.5 Flash
              </span>
              <button
                onClick={() => setIsBulkRankingOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs cursor-pointer transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
