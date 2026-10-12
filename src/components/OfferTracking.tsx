import React, { useState } from 'react';
import {
  FileCheck,
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  FileText,
  Download,
  Search,
  Sparkles,
  X,
  UserCheck,
  ShieldCheck,
  PartyPopper
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { OfferRecord, StudentProfile } from '../types';

interface OfferTrackingProps {
  offers: OfferRecord[];
  students: StudentProfile[];
  onUpdateOfferStatus: (offerId: string, newStatus: OfferRecord['status']) => void;
  onUpdateDocumentVerified: (offerId: string, docIndex: number, verified: boolean) => void;
}

export const OfferTracking: React.FC<OfferTrackingProps> = ({
  offers,
  students,
  onUpdateOfferStatus,
  onUpdateDocumentVerified,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedOffer, setSelectedOffer] = useState<OfferRecord | null>(null);

  // Real Gemini AI Offer Analysis State
  const [analyzingOffer, setAnalyzingOffer] = useState<OfferRecord | null>(null);
  const [offerAnalysis, setOfferAnalysis] = useState<any | null>(null);
  const [isAnalyzingOffer, setIsAnalyzingOffer] = useState(false);
  const [offerAnalysisError, setOfferAnalysisError] = useState<string | null>(null);

  const handleAnalyzeOffer = async (offer: OfferRecord) => {
    setAnalyzingOffer(offer);
    setIsAnalyzingOffer(true);
    setOfferAnalysis(null);
    setOfferAnalysisError(null);

    try {
      const res = await fetch('/api/gemini/analyze-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      setOfferAnalysis(data.analysis);
    } catch (err: any) {
      console.error('Offer analysis failed:', err);
      setOfferAnalysisError(err.message || 'Failed to analyze offer');
    } finally {
      setIsAnalyzingOffer(false);
    }
  };

  const filteredOffers = offers.filter((o) => {
    const matchesSearch =
      o.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.usn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (offer: OfferRecord, newStatus: OfferRecord['status']) => {
    onUpdateOfferStatus(offer.id, newStatus);
    if (newStatus === 'Joined' || newStatus === 'Accepted') {
      // Trigger joyful celebration confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b'],
      });
    }
  };

  const totalOffersCount = offers.length;
  const joinedCount = offers.filter((o) => o.status === 'Joined').length;
  const verifiedCount = offers.filter((o) => o.status === 'Verified' || o.status === 'Joined').length;
  const avgCTC =
    offers.length > 0
      ? (offers.reduce((acc, curr) => acc + curr.ctcLPA, 0) / offers.length).toFixed(1)
      : '0';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Offer Letters, KYC &amp; Corporate Joining Tracking</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              {offers.length} Offers Issued
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            End-to-end audit trail of corporate offer letters, academic clearance document verification, and joining onboarding milestones.
          </p>
        </div>

        {/* Celebration stats pill */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl flex items-center space-x-2">
            <span className="text-slate-500 dark:text-slate-400">Average CTC:</span>
            <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{avgCTC} LPA</span>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 text-emerald-800 dark:text-emerald-300 font-bold">
            <PartyPopper className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{joinedCount} Joined Corporate</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Offers Issued
          </span>
          <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{totalOffersCount}</div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">100% digitally verified</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Offer Acceptance
          </span>
          <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {Math.round(((joinedCount + offers.filter((o) => o.status === 'Accepted').length) / Math.max(1, offers.length)) * 100)}%
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Low backed out rate</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Documentation Verified
          </span>
          <div className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-400">{verifiedCount}</div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Degree &amp; KYC audited</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Joining Confirmed
          </span>
          <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{joinedCount}</div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Onboarding active</span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search student, USN, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-500 dark:text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="All">All Statuses</option>
            <option value="Offer Issued">Offer Issued</option>
            <option value="Accepted">Accepted</option>
            <option value="Documentation Pending">Documentation Pending</option>
            <option value="Verified">Verified</option>
            <option value="Joined">Joined</option>
            <option value="Backed Out">Backed Out</option>
          </select>
        </div>
      </div>

      {/* Offer Records Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Student &amp; USN</th>
                <th className="py-3 px-3">Recruiter &amp; Role</th>
                <th className="py-3 px-3">CTC Package</th>
                <th className="py-3 px-3">Joining Date</th>
                <th className="py-3 px-3">Document KYC</th>
                <th className="py-3 px-3">Offer Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredOffers.map((offer) => {
                const verifiedDocsCount = offer.documents.filter((d) => d.verified).length;
                const totalDocsCount = offer.documents.length;
                const isDocsComplete = verifiedDocsCount === totalDocsCount;

                return (
                  <tr key={offer.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    {/* Student */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{offer.studentName}</span>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          {offer.usn} • {offer.branch}
                        </span>
                      </div>
                    </td>

                    {/* Company & Role */}
                    <td className="py-3.5 px-3">
                      <div>
                        <span className="font-bold text-indigo-950 dark:text-indigo-300 block">{offer.companyName}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">{offer.role}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block">{offer.workLocation}</span>
                      </div>
                    </td>

                    {/* CTC */}
                    <td className="py-3.5 px-3">
                      <span className="text-sm font-black text-slate-900 dark:text-white block">
                        {offer.ctcLPA} LPA
                      </span>
                      {offer.bondYears ? (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1 rounded font-medium">
                          {offer.bondYears} Yr Bond
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 rounded font-medium">
                          No Bond
                        </span>
                      )}
                    </td>

                    {/* Joining Date */}
                    <td className="py-3.5 px-3">
                      <span className="font-semibold text-slate-800 block">{offer.joiningDate}</span>
                      <span className="text-[10px] text-slate-400">
                        Deadline: {offer.acceptanceDeadline}
                      </span>
                    </td>

                    {/* Document Checklist */}
                    <td className="py-3.5 px-3">
                      <button
                        onClick={() => setSelectedOffer(offer)}
                        className="flex items-center space-x-1 text-slate-700 hover:text-indigo-600 font-medium"
                      >
                        <ShieldCheck
                          className={`w-4 h-4 ${
                            isDocsComplete ? 'text-emerald-500' : 'text-amber-500'
                          }`}
                        />
                        <span>
                          {verifiedDocsCount}/{totalDocsCount} Verified
                        </span>
                      </button>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-3">
                      <select
                        value={offer.status}
                        onChange={(e) =>
                          handleStatusChange(offer, e.target.value as OfferRecord['status'])
                        }
                        className={`text-xs font-bold rounded-lg px-2 py-1 border transition cursor-pointer ${
                          offer.status === 'Joined'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : offer.status === 'Verified'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                            : offer.status === 'Accepted'
                            ? 'bg-blue-50 text-blue-700 border-blue-300'
                            : 'bg-amber-50 text-amber-700 border-amber-300'
                        }`}
                      >
                        <option value="Offer Issued">Offer Issued</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Documentation Pending">Documentation Pending</option>
                        <option value="Verified">Verified</option>
                        <option value="Joined">Joined (Corporate)</option>
                        <option value="Backed Out">Backed Out</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleAnalyzeOffer(offer)}
                          className="bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-lg font-semibold transition flex items-center space-x-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                          <span>AI Audit</span>
                        </button>
                        <button
                          onClick={() => setSelectedOffer(offer)}
                          className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer"
                        >
                          Verify Docs
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Verification & Audit Checklist Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Document Verification Checklist
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                  {selectedOffer.studentName} ({selectedOffer.usn}) — {selectedOffer.companyName}
                </p>
              </div>

              <button
                onClick={() => setSelectedOffer(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {selectedOffer.documents.map((doc, idx) => (
                <div
                  key={doc.name}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2.5">
                    <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block">{doc.name}</span>
                      {doc.fileUploaded ? (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                          ✓ Uploaded: {doc.fileUploaded}
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400">Pending candidate upload</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onUpdateDocumentVerified(selectedOffer.id, idx, !doc.verified);
                      // mutate local modal view
                      doc.verified = !doc.verified;
                    }}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                      doc.verified
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {doc.verified ? 'Verified' : 'Verify'}
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Placement Cell Rooman Technologies KYC Protocol
              </span>
              <button
                onClick={() => setSelectedOffer(null)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Offer & Total Rewards Analysis Modal */}
      {analyzingOffer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    AI Offer &amp; Compensation Legal Audit
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">
                    {analyzingOffer.studentName} • {analyzingOffer.companyName} ({analyzingOffer.role})
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setAnalyzingOffer(null);
                  setOfferAnalysis(null);
                  setOfferAnalysisError(null);
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner */}
            {offerAnalysisError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Gemini AI Error: {offerAnalysisError}</span>
                </div>
              </div>
            )}

            {/* Loading */}
            {isAnalyzingOffer && (
              <div className="py-12 text-center space-y-3">
                <span className="h-8 w-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin inline-block" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Analyzing compensation package, ESOP vesting, and service bond risks with Gemini 2.5 Flash...
                </p>
              </div>
            )}

            {/* Analysis Results */}
            {offerAnalysis && (
              <div className="space-y-4 animate-fade-in">
                {/* Decision Verdict Badge */}
                <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider block">
                      Placement Cell Recommendation
                    </span>
                    <span className="text-sm font-black text-indigo-900 dark:text-indigo-200">
                      {offerAnalysis.decisionVerdict}
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    offerAnalysis.bondAnalysis?.riskLevel === 'Low'
                      ? 'bg-emerald-100 text-emerald-800'
                      : offerAnalysis.bondAnalysis?.riskLevel === 'Medium'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    Bond Risk: {offerAnalysis.bondAnalysis?.riskLevel || 'Standard'}
                  </span>
                </div>

                {/* Financial Breakdown */}
                {offerAnalysis.financialBreakdown && (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Fixed Base Annual</span>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        {offerAnalysis.financialBreakdown.estimatedFixedBase}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Variable / Bonus</span>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        {offerAnalysis.financialBreakdown.variableBonus}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Est. Take-Home / Mo</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                        {offerAnalysis.financialBreakdown.estimatedMonthlyTakeHome}
                      </span>
                    </div>
                  </div>
                )}

                {/* Bond & Service Agreement Audit */}
                {offerAnalysis.bondAnalysis && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                      📜 Service Agreement &amp; Exit Clause Audit:
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      {offerAnalysis.bondAnalysis.advisoryVerdict}
                    </p>
                    {offerAnalysis.bondAnalysis.hasServiceAgreementOrBond && (
                      <div className="flex gap-4 text-[10px] pt-1 font-semibold text-slate-500">
                        <span>Duration: {offerAnalysis.bondAnalysis.bondDuration}</span>
                        <span>Penalty: {offerAnalysis.bondAnalysis.exitPenalty}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Favorable vs Red Flags */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                      ✓ Favorable Terms:
                    </span>
                    <ul className="space-y-1 text-[11px] text-emerald-700 dark:text-emerald-400 list-disc list-inside">
                      {(offerAnalysis.favorableHighlights || []).map((h: string, i: number) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                    <span className="font-bold text-rose-800 dark:text-rose-300 block mb-1">
                      ⚠ Hidden Caveats / Red Flags:
                    </span>
                    <ul className="space-y-1 text-[11px] text-rose-700 dark:text-rose-400 list-disc list-inside">
                      {(offerAnalysis.hiddenCaveatsOrRedFlags || []).map((f: string, i: number) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  setAnalyzingOffer(null);
                  setOfferAnalysis(null);
                }}
                className="bg-slate-900 dark:bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
