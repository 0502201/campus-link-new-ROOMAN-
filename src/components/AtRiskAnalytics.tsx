import React, { useState } from 'react';
import {
  AlertTriangle,
  Users,
  Sparkles,
  BookOpen,
  Calendar,
  CheckCircle2,
  TrendingDown,
  Clock,
  Send,
  Download,
  Filter,
  Search,
  FileSpreadsheet,
  BrainCircuit
} from 'lucide-react';
import { StudentProfile } from '../types';

interface AtRiskAnalyticsProps {
  students: StudentProfile[];
  onOpenStudentProfile: (student: StudentProfile) => void;
}

export const AtRiskAnalytics: React.FC<AtRiskAnalyticsProps> = ({
  students,
  onOpenStudentProfile,
}) => {
  const [filterReason, setFilterReason] = useState<string>('All');
  const [assignedMentors, setAssignedMentors] = useState<Record<string, string>>({
    'std-105': 'Prof. Raghavan (CSE Lead)',
  });

  // Real Gemini AI Predictive Radar State
  const [isRunningRadar, setIsRunningRadar] = useState(false);
  const [radarPrediction, setRadarPrediction] = useState<any | null>(null);
  const [radarError, setRadarError] = useState<string | null>(null);
  const [selectedRadarStudent, setSelectedRadarStudent] = useState<StudentProfile | null>(null);

  const atRiskStudents = students.filter((s) => s.isAtRisk || s.activeBacklogs > 0 || s.attendancePercent < 75);

  const filtered = atRiskStudents.filter((s) => {
    if (filterReason === 'Backlogs') return s.activeBacklogs > 0;
    if (filterReason === 'Attendance') return s.attendancePercent < 75;
    if (filterReason === 'MockScore') return s.mockInterviewScore < 60;
    return true;
  });

  const runPredictiveRadar = async (studentTarget?: StudentProfile) => {
    const target = studentTarget || selectedRadarStudent || atRiskStudents[0] || students[0];
    if (!target) return;
    setSelectedRadarStudent(target);
    setIsRunningRadar(true);
    setRadarError(null);

    try {
      const res = await fetch('/api/gemini/predict-at-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: target,
          cohortContext: {
            totalMonitored: atRiskStudents.length,
            batch: target.batch,
            branch: target.branch
          }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      setRadarPrediction(data.prediction);
    } catch (err: any) {
      console.error('Radar failed:', err);
      setRadarError(err.message || 'Failed to run predictive radar');
    } finally {
      setIsRunningRadar(false);
    }
  };

  const assignMentor = (studentId: string, mentorName: string) => {
    setAssignedMentors((prev) => ({
      ...prev,
      [studentId]: mentorName,
    }));
  };

  const handleExportAtRiskReport = () => {
    const headers = 'USN,Student Name,Branch,CGPA,Active Backlogs,Attendance %,Mock Score %,Assigned Mentor,Primary Risk\n';
    const rows = filtered
      .map(
        (s) =>
          `"${s.usn}","${s.name}","${s.branch}",${s.cgpa},${s.activeBacklogs},${s.attendancePercent}%,${s.mockInterviewScore}%,"${
            assignedMentors[s.id] || 'Unassigned'
          }","${(s.riskReasons || []).join('; ')}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CAMPUSLINK_AtRisk_Intervention_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Predictive At-Risk Student Radar &amp; Remedial Interventions</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200">
              {atRiskStudents.length} Students Monitored
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Proactive intervention engine identifying academic backlogs, low mock test performance, and attendance dips before recruiter cutoffs lock.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => runPredictiveRadar()}
            disabled={isRunningRadar}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center space-x-1.5 shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isRunningRadar ? (
              <>
                <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Analyzing Cohort with Gemini AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Run Gemini AI Placement Radar</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportAtRiskReport}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Real HTTP Error Alert (Transparently shown if API fails) */}
      {radarError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold">Gemini AI Service Error</p>
              <p className="text-[11px] text-rose-700 dark:text-rose-300">{radarError}</p>
            </div>
          </div>
          <button
            onClick={() => setRadarError(null)}
            className="text-xs font-bold px-2 py-1 rounded hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Real Gemini Predictive Radar Insights Panel */}
      {radarPrediction && selectedRadarStudent && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 shadow-xl space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <span className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-black flex items-center space-x-2">
                  <span>Gemini AI Predictive Placement Assessment</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 font-normal">
                    {selectedRadarStudent.name} ({selectedRadarStudent.usn})
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time neural risk classification powered by Gemini 2.5 Flash
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                radarPrediction.riskSeverity?.includes('Critical')
                  ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                  : radarPrediction.riskSeverity?.includes('High')
                  ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                  : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
              }`}>
                {radarPrediction.riskSeverity || 'Evaluated'}
              </span>
              <button
                onClick={() => setRadarPrediction(null)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
              <span className="text-xs text-slate-400 block mb-1">Probability of Remaining Unplaced</span>
              <span className="text-3xl font-black text-rose-400">
                {radarPrediction.unplacedProbabilityPercent}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">Based on backlog trajectory &amp; mock performance</span>
            </div>

            <div className="md:col-span-2 bg-white/5 rounded-xl p-4 border border-white/10 space-y-2">
              <span className="text-xs font-bold text-indigo-300 block">Primary Risk Drivers Identified by AI:</span>
              <div className="flex flex-wrap gap-1.5">
                {(radarPrediction.primaryRiskDrivers || []).map((drv: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-200 border border-rose-500/30 text-[11px] font-semibold">
                    ⚠ {drv}
                  </span>
                ))}
              </div>
              {radarPrediction.facultyMentorGuidanceNote && (
                <p className="text-[11px] text-slate-300 italic pt-1 border-t border-white/10">
                  "{radarPrediction.facultyMentorGuidanceNote}"
                </p>
              )}
            </div>
          </div>

          {/* Diagnostic Breakdown */}
          {radarPrediction.diagnosticAnalysis && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <span className="font-bold text-amber-300 block mb-1">Academic Status:</span>
                <p className="text-[11px] text-slate-300">{radarPrediction.diagnosticAnalysis.academicStanding}</p>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <span className="font-bold text-indigo-300 block mb-1">Coding Proficiency:</span>
                <p className="text-[11px] text-slate-300">{radarPrediction.diagnosticAnalysis.codingProficiency}</p>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <span className="font-bold text-emerald-300 block mb-1">Communication / Mock:</span>
                <p className="text-[11px] text-slate-300">{radarPrediction.diagnosticAnalysis.interviewCommunication}</p>
              </div>
            </div>
          )}

          {/* Prescribed Roadmap */}
          {radarPrediction.prescribedInterventionRoadmap?.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-indigo-300 block">AI-Prescribed 4-Week Rooman Remedial Intervention:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                {radarPrediction.prescribedInterventionRoadmap.map((item: any, i: number) => (
                  <div key={i} className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-1">
                    <span className="text-[10px] font-bold text-amber-300 uppercase">Week {item.week}</span>
                    <p className="text-[11px] text-slate-200 font-semibold">{item.action}</p>
                    <p className="text-[10px] text-emerald-400">Target: {item.targetLiftMetric}</p>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 block truncate">
                      {item.roomanClinic}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recommended Rooman Intervention Tracks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
            <BookOpen className="w-4 h-4" />
            <span>Track A: DSA &amp; Coding Accelerator</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
            4-week intense problem-solving cohort focusing on LeetCode patterns for students with &lt;100 coding problems.
          </p>
          <div className="mt-3 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">18 Students Enrolled</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">88% Completion</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
            <Clock className="w-4 h-4" />
            <span>Track B: Academic Backlog Clearance</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
            Faculty-led evening tutorial clinics targeted at clearing Math &amp; Core engineering backlog subjects.
          </p>
          <div className="mt-3 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">12 Students Enrolled</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">Special Exam Slot</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
            <Sparkles className="w-4 h-4" />
            <span>Track C: Corporate Soft Skills &amp; Mock HR</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
            1-on-1 Rooman corporate trainer sessions addressing interview anxiety, STAR storytelling, and resume polishing.
          </p>
          <div className="mt-3 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">14 Students Enrolled</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">Active</span>
          </div>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-600 dark:text-slate-300">Filter By Risk Vector:</span>
          {(['All', 'Backlogs', 'Attendance', 'MockScore'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setFilterReason(r)}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                filterReason === r
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {r === 'All' ? 'All Risks' : r === 'Backlogs' ? 'Active Backlogs' : r === 'Attendance' ? 'Low Attendance (<75%)' : 'Mock Score (<60%)'}
            </button>
          ))}
        </div>

        <span className="text-slate-400 dark:text-slate-500 text-[11px]">
          Showing {filtered.length} priority students
        </span>
      </div>

      {/* At Risk Student Grid */}
      <div className="space-y-3">
        {filtered.map((s) => {
          const mentor = assignedMentors[s.id];
          return (
            <div
              key={s.id}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200/80 dark:border-rose-900/60 shadow-xs hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Left Student Info */}
              <div className="flex items-start space-x-3.5">
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{s.name}</h3>
                    <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                      {s.usn}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      {s.branch} • CGPA: {s.cgpa}
                    </span>
                  </div>

                  {/* Risk Badges */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {s.activeBacklogs > 0 && (
                      <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                        {s.activeBacklogs} Active Backlog{s.activeBacklogs > 1 ? 's' : ''}
                      </span>
                    )}
                    {s.attendancePercent < 75 && (
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                        Attendance: {s.attendancePercent}% (Mandatory 75%)
                      </span>
                    )}
                    {s.mockInterviewScore < 60 && (
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        Mock Interview: {s.mockInterviewScore}%
                      </span>
                    )}
                  </div>

                  {s.riskReasons && (
                    <ul className="mt-2 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400 list-disc list-inside">
                      {s.riskReasons.slice(0, 2).map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Right Mentor & Action Section */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-end text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Assigned Mentor</span>
                  {mentor ? (
                    <span className="font-bold text-indigo-900 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded block">
                      {mentor}
                    </span>
                  ) : (
                    <select
                      onChange={(e) => assignMentor(s.id, e.target.value)}
                      defaultValue=""
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-[11px] text-slate-700 dark:text-slate-200"
                    >
                      <option value="" disabled>
                        + Assign Faculty Mentor
                      </option>
                      <option value="Prof. Raghavan (CSE)">Prof. Raghavan (CSE)</option>
                      <option value="Dr. Sangeetha (IT)">Dr. Sangeetha (IT)</option>
                      <option value="Rooman Career Counselor">Rooman Career Counselor</option>
                    </select>
                  )}
                </div>

                <button
                  onClick={() => runPredictiveRadar(s)}
                  className="bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold px-3 py-1.5 rounded-xl transition flex items-center space-x-1 cursor-pointer shadow-2xs"
                >
                  <BrainCircuit className="w-3.5 h-3.5" />
                  <span>AI Radar</span>
                </button>

                <button
                  onClick={() => onOpenStudentProfile(s)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded-xl transition flex items-center space-x-1 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Remedial Plan</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
