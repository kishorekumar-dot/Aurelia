// src/pages/Report.tsx
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AureliaHeader } from '../components/AureliaHeader';
import { api } from '../services/api';

interface ApiFinding {
  id: number;
  claim: string;
  category: string;
  severity: string;
  location: { page?: number; section?: string } | null;
  status: string;
  authority: string;
  recommendation: string;
  evidence: { observation: string; value?: string; method: string; confidence: number; location?: string; source?: string }[];
}

interface ApiReport {
  review_id: number;
  status: string;
  metrics: { total: number; verified_automatic: number; needs_review: number; contradicted: number; approved: number; rejected: number };
  verified_findings: ApiFinding[];
  review_findings: ApiFinding[];
  contradicted_findings: ApiFinding[];
  all_findings: ApiFinding[];
}

interface ApiReview {
  id: number;
  title: string;
  student_name: string;
  status: string;
  overall_score?: number;
  format_score?: number;
  content_score?: number;
  innovation_score?: number;
  consistency_score?: number;
  confidence_score?: number;
  routing_decision?: string;
  is_published?: boolean;
}

export default function Report() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ApiReport | null>(null);
  const [reviewMeta, setReviewMeta] = useState<ApiReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'DOSSIER' | 'STUDENT_PREVIEW'>('DOSSIER');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'VERIFIED' | 'NEEDS_REVIEW' | 'CONTRADICTED' | 'APPROVED' | 'REJECTED'>('ALL');
  
  const [editingFindingId, setEditingFindingId] = useState<number | null>(null);
  const [editRecommendation, setEditRecommendation] = useState('');
  const [editSeverity, setEditSeverity] = useState('MINOR');
  const [lecturerNote, setLecturerNote] = useState('');
  const [publishSuccessModal, setPublishSuccessModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [reportData, reviewData] = await Promise.all([
        api.getReviewReport(id) as Promise<ApiReport>,
        api.getReview(id) as unknown as Promise<ApiReview>
      ]);
      setReport(reportData);
      setReviewMeta(reviewData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);


  const handleApprove = async (findingId: number) => {
    setActionLoading(true);
    try { await api.approveFinding(findingId, lecturerNote || undefined); await fetchData(); }
    catch (e) { console.error(e); } finally { setActionLoading(false); }
  };

  const handleReject = async (findingId: number) => {
    setActionLoading(true);
    try { await api.rejectFinding(findingId); await fetchData(); }
    catch (e) { console.error(e); } finally { setActionLoading(false); }
  };

  const handleStartEdit = (f: ApiFinding) => {
    setEditingFindingId(f.id);
    setEditRecommendation(f.recommendation);
    setEditSeverity(f.severity);
    setLecturerNote('');
  };

  const handleSaveEdit = async (findingId: number) => {
    setActionLoading(true);
    try {
      await api.modifyFinding(findingId, editSeverity, editRecommendation, lecturerNote || undefined);
      await fetchData();
      setEditingFindingId(null);
    } catch (e) { console.error(e); } finally { setActionLoading(false); }
  };

  const handlePublish = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await api.publishReview(id);
      await fetchData();
      setPublishSuccessModal(true);
    } catch (e) { console.error(e); } finally { setActionLoading(false); }
  };

  const handleExportDossier = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Aurelia_Lecturer_Dossier_REV${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center font-mono text-[#F5A623]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin mx-auto" />
          Loading review report...
        </div>
      </div>
    );
  }

  if (error || !report || !reviewMeta) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center font-mono text-red-400">
        <div className="text-center space-y-3">
          <div className="text-2xl">Error</div>
          <p>{error || 'Report not found'}</p>
          <Link to="/dashboard" className="text-[#F5A623] underline">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const allFindings = report.all_findings;
  const filteredFindings = allFindings.filter((f) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'VERIFIED') return f.status === 'VERIFIED' && f.authority === 'AUTOMATIC';
    if (selectedFilter === 'NEEDS_REVIEW') return f.authority === 'LECTURER' || f.authority === 'QUALIFIED_AI' || f.status === 'INSUFFICIENT';
    if (selectedFilter === 'CONTRADICTED') return f.status === 'CONTRADICTED';
    if (selectedFilter === 'APPROVED') return f.status === 'APPROVED' || f.status === 'PUBLISHED';
    if (selectedFilter === 'REJECTED') return f.status === 'REJECTED';
    return true;
  });

  const approvedCount = allFindings.filter(f => f.status === 'APPROVED' || f.status === 'PUBLISHED').length;
  const isPublished = reviewMeta.status === 'PUBLISHED';

  return (
    <div className="min-h-screen bg-[#050508] text-[#E8E8EE] flex flex-col font-body">
      <AureliaHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pt-28 pb-20 space-y-10">
        
        {/* Top Control Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[rgba(245,166,35,0.18)] pb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-xs text-[#F5A623] tracking-[0.24em] uppercase block">
                Folio Evaluation Record #{reviewMeta.id}
              </span>
              {isPublished ? (
                <span className="font-mono text-[0.65rem] px-2 py-0.5 border border-[#22C55E]/40 text-[#22C55E] bg-[#22C55E]/10 uppercase tracking-widest">
                  PUBLISHED TO STUDENT
                </span>
              ) : (
                <span className="font-mono text-[0.65rem] px-2 py-0.5 border border-[#F5A623]/40 text-[#F5A623] bg-[#F5A623]/10 uppercase tracking-widest">
                  FACULTY AUDIT ACTIVE
                </span>
              )}
            </div>
            <h1 className="font-headline text-3xl md:text-4xl font-light text-white tracking-wide">
              {reviewMeta.title}
            </h1>
            <p className="text-xs font-mono text-[#8A8B98] mt-1.5">
              Candidate: <span className="text-white">{reviewMeta.student_name}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/dashboard"
              className="px-4 py-2.5 border border-white/15 text-xs font-headline tracking-[0.16em] uppercase text-[#9A9BA8] hover:text-white hover:border-white/40 transition-colors"
            >
              ← Desk
            </Link>

            <button
              onClick={handleExportDossier}
              className="px-4 py-2.5 border border-white/15 text-xs font-headline tracking-[0.16em] uppercase text-[#9A9BA8] hover:text-white hover:border-white/40 transition-colors"
            >
              Export Dossier JSON
            </button>

            <button
              onClick={handlePublish}
              disabled={actionLoading || isPublished}
              className={`px-6 py-2.5 text-xs font-headline tracking-[0.18em] uppercase transition-all shadow-lg ${
                isPublished
                  ? 'border border-[#22C55E]/50 text-[#22C55E] bg-[#22C55E]/10 cursor-default'
                  : 'btn-terracotta cursor-pointer'
              }`}
            >
              {isPublished ? '✓ Published to Candidate' : 'Publish Feedback to Student →'}
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 border-b border-white/[0.08]">
          <button
            onClick={() => setActiveTab('DOSSIER')}
            className={`font-headline text-xs tracking-[0.18em] uppercase py-3 px-5 border-b-2 transition-colors ${
              activeTab === 'DOSSIER'
                ? 'border-[#F5A623] text-white bg-white/[0.02]'
                : 'border-transparent text-[#8A8B98] hover:text-white'
            }`}
          >
            Lecturer Evidence Dossier
          </button>
          <button
            onClick={() => setActiveTab('STUDENT_PREVIEW')}
            className={`font-headline text-xs tracking-[0.18em] uppercase py-3 px-5 border-b-2 transition-colors ${
              activeTab === 'STUDENT_PREVIEW'
                ? 'border-[#7B6CFF] text-white bg-white/[0.02]'
                : 'border-transparent text-[#8A8B98] hover:text-white'
            }`}
          >
            Student Feedback Preview ({approvedCount} Approved)
          </button>
        </div>

        {/* TAB 1: LECTURER EVIDENCE DOSSIER */}
        {activeTab === 'DOSSIER' && (
          <div className="space-y-10">
            {/* Header Strip with Scores & Routing Badge */}
            <div className="mounted-document p-8 space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-6 border-b border-[rgba(245,166,35,0.18)]">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
                  {[
                    { label: 'Format Score (20%)', val: reviewMeta.format_score, color: 'text-white', unit: '/100' },
                    { label: 'Content Score (40%)', val: reviewMeta.content_score, color: 'text-[#F5A623]', unit: '/100' },
                    { label: 'Innovation (25%)', val: reviewMeta.innovation_score, color: 'text-[#7B6CFF]', unit: '/100' },
                    { label: 'Consistency (15%)', val: reviewMeta.consistency_score, color: 'text-[#6EC8FF]', unit: '/100' },
                    { label: 'Confidence Delta', val: reviewMeta.confidence_score, color: 'text-green-400', unit: '%' },
                  ].map(({ label, val, color, unit }) => (
                    <div key={label}>
                      <span className="font-headline text-[0.68rem] tracking-[0.18em] text-[#8A8B98] uppercase block mb-1">{label}</span>
                      <div className={`font-mono text-2xl font-light ${color}`}>
                        {val != null ? Math.round(val) : '—'}<span className="text-sm text-[#6A6B78]">{unit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col items-start lg:items-end">
                  <span className="font-headline text-[0.68rem] tracking-[0.18em] text-[#8A8B98] uppercase mb-1">
                    PRD Governance Routing (FR-16)
                  </span>
                  <div className="font-mono text-xs tracking-widest px-4 py-2 border border-[#F5A623] text-[#F5A623] bg-[#F5A623]/10">
                    {reviewMeta.routing_decision === 'AUTOMATIC' ? 'LEVEL 3: AUTOMATIC PASS' : 'LEVEL 1: LECTURER AUDIT REQUIRED'}
                  </div>
                  <div className="mt-2 font-mono text-xs text-[#8A8B98]">
                    {report.metrics.total} findings · {report.metrics.verified_automatic} auto-verified · {report.metrics.needs_review} needs review
                  </div>
                </div>
              </div>

              {/* Filter Tabs for Findings */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-[#8A8B98] mr-2">Filter Findings:</span>
                  {(['ALL', 'VERIFIED', 'NEEDS_REVIEW', 'CONTRADICTED', 'APPROVED', 'REJECTED'] as const).map((filterKey) => (
                    <button
                      key={filterKey}
                      onClick={() => setSelectedFilter(filterKey)}
                      className={`px-3 py-1 font-mono text-[0.68rem] uppercase tracking-wider border transition-colors ${
                        selectedFilter === filterKey
                          ? 'border-[#F5A623] text-[#F5A623] bg-[#F5A623]/10'
                          : 'border-white/10 text-[#8A8B98] hover:text-white'
                      }`}
                    >
                      {filterKey.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <span className="font-mono text-xs text-[#6A6B78]">
                  Showing {filteredFindings.length} of {allFindings.length} findings
                </span>
              </div>
            </div>

            {/* Findings List with Structured Evidence */}
            <div className="space-y-6">
              {filteredFindings.length === 0 && (
                <div className="mounted-document p-12 text-center font-mono text-xs text-[#8A8B98]">
                  No findings match the selected filter. Try selecting "ALL" to see all findings.
                </div>
              )}
              {filteredFindings.map((f) => (
                <div
                  key={f.id}
                  className={`mounted-document p-8 space-y-6 relative overflow-hidden transition-all ${
                    f.status === 'CONTRADICTED' ? 'border-l-4 border-l-[#EF4444]' :
                    f.status === 'APPROVED' || f.status === 'PUBLISHED' ? 'border-l-4 border-l-[#22C55E]' :
                    f.status === 'REJECTED' ? 'opacity-60 border-l-4 border-l-white/20' : ''
                  }`}
                >
                  {/* Top Finding Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
                    <div className="flex items-center gap-3 font-mono text-xs flex-wrap">
                      <span className="text-[#F5A623] font-medium tracking-wider">
                        [#{f.id}] {f.category}
                      </span>
                      {f.location && (
                        <span className="text-[#8A8B98]">
                          {f.location.section ? `${f.location.section}` : ''}{f.location.page ? ` · p.${f.location.page}` : ''}
                        </span>
                      )}
                      <span className={`uppercase px-2 py-0.5 border text-[0.65rem] ${
                        f.severity?.toUpperCase() === 'CRITICAL' ? 'border-[#EF4444]/40 text-[#EF4444] bg-[#EF4444]/10' :
                        f.severity?.toUpperCase() === 'MAJOR' ? 'border-[#F5A623]/40 text-[#F5A623] bg-[#F5A623]/10' :
                        'border-white/20 text-[#8A8B98]'
                      }`}>
                        {f.severity?.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[0.68rem] text-[#7B6CFF] tracking-wider uppercase">
                        {f.authority === 'AUTOMATIC' ? 'LEVEL 3 · AUTOMATIC' :
                         f.authority === 'QUALIFIED_AI' ? 'LEVEL 2 · QUALIFIED AI' : 'LEVEL 1 · LECTURER JUDGMENT'}
                      </span>
                      <span className={`font-mono text-[0.68rem] tracking-wider px-2.5 py-0.5 border uppercase ${
                        f.status === 'PUBLISHED' ? 'border-[#22C55E]/50 text-[#22C55E] bg-[#22C55E]/10' :
                        f.status === 'APPROVED' ? 'border-[#22C55E]/40 text-[#22C55E] bg-[#22C55E]/10' :
                        f.status === 'CONTRADICTED' ? 'border-[#EF4444]/40 text-[#EF4444] bg-[#EF4444]/10' :
                        f.status === 'REJECTED' ? 'border-white/20 text-[#8A8B98]' :
                        'border-[#F5A623]/40 text-[#F5A623] bg-[#F5A623]/10'
                      }`}>
                        {f.status}
                      </span>
                    </div>
                  </div>

                  {/* Claim */}
                  <div>
                    <span className="font-headline text-[0.68rem] tracking-[0.16em] text-[#8A8B98] uppercase block mb-1">Finding</span>
                    <p className="text-white font-light leading-relaxed">{f.claim}</p>
                  </div>

                  {/* Evidence List */}
                  {f.evidence && f.evidence.length > 0 && (
                    <div className="mounted-document-subtle p-5 space-y-3 font-mono text-xs">
                      <span className="text-[#F5A623] uppercase tracking-wider text-[0.7rem] font-medium block border-b border-white/[0.06] pb-2">
                        Structured Evidence (PRD Section 15)
                      </span>
                      {f.evidence.map((ev, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[#A4A5B6]">
                            <div>
                              <span className="text-[#6A6B78] uppercase block text-[0.65rem]">Method:</span>
                              <span>{ev.method}</span>
                            </div>
                            <div>
                              <span className="text-[#6A6B78] uppercase block text-[0.65rem]">Confidence:</span>
                              <span>{(ev.confidence * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-[#6A6B78] uppercase block text-[0.65rem]">Observation:</span>
                            <p className="text-white mt-0.5 leading-relaxed">{ev.observation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recommendation */}
                  <div className="space-y-1 text-xs">
                    <span className="font-headline text-[0.68rem] tracking-[0.16em] text-[#7B6CFF] uppercase block">
                      Proposed Recommendation
                    </span>
                    <p className="text-white font-light leading-relaxed">{f.recommendation}</p>
                  </div>

                  {/* Inline Edit Form */}
                  {editingFindingId === f.id && (
                    <div className="p-5 bg-[#080916] border border-[#F5A623]/40 space-y-4 font-mono text-xs">
                      <span className="text-[#F5A623] font-headline uppercase tracking-wider text-xs block">
                        Edit Finding & Recommendation
                      </span>
                      <div>
                        <label className="block text-[#8A8B98] mb-1">Tailored Recommendation for Student:</label>
                        <textarea
                          rows={3}
                          value={editRecommendation}
                          onChange={(e) => setEditRecommendation(e.target.value)}
                          className="w-full bg-[#050508] border border-white/20 p-2.5 text-white focus:outline-none focus:border-[#F5A623]"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[#8A8B98] mb-1">Override Severity:</label>
                          <select
                            value={editSeverity}
                            onChange={(e) => setEditSeverity(e.target.value)}
                            className="w-full bg-[#050508] border border-white/20 p-2 text-white"
                          >
                            <option value="critical">CRITICAL</option>
                            <option value="major">MAJOR</option>
                            <option value="minor">MINOR</option>
                            <option value="info">INFO</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[#8A8B98] mb-1">Lecturer Note / Viva Query:</label>
                          <input
                            type="text"
                            value={lecturerNote}
                            onChange={(e) => setLecturerNote(e.target.value)}
                            placeholder="Optional note..."
                            className="w-full bg-[#050508] border border-white/20 p-2 text-white"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => handleSaveEdit(f.id)}
                          disabled={actionLoading}
                          className="btn-terracotta px-4 py-2 text-xs tracking-wider uppercase cursor-pointer"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditingFindingId(null)}
                          className="px-4 py-2 border border-white/20 text-xs font-mono text-[#8A8B98] hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Lecturer Action Buttons Bar */}
                  <div className="pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
                    <div className="font-mono text-[0.7rem] text-[#6A6B78]">
                      {f.status === 'PUBLISHED' ? (
                        <span className="text-[#22C55E]">✓ INCLUDED IN PUBLISHED STUDENT FEEDBACK</span>
                      ) : f.status === 'APPROVED' ? (
                        <span className="text-[#22C55E]">APPROVED — WILL BE PUBLISHED UPON RELEASE</span>
                      ) : f.status === 'REJECTED' ? (
                        <span className="text-[#8A8B98]">REJECTED / MARKED FALSE POSITIVE</span>
                      ) : (
                        <span>AWAITING LECTURER DECISION</span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleApprove(f.id)}
                        disabled={actionLoading}
                        className={`px-3 py-1 text-[0.68rem] font-headline tracking-wider uppercase border transition-colors ${
                          f.status === 'APPROVED' || f.status === 'PUBLISHED'
                            ? 'border-[#22C55E] text-[#22C55E] bg-[#22C55E]/10'
                            : 'border-white/15 text-[#9A9BA8] hover:text-white hover:border-[#22C55E]'
                        }`}
                      >
                        Approve for Student
                      </button>

                      <button
                        onClick={() => handleStartEdit(f)}
                        disabled={actionLoading}
                        className="px-3 py-1 text-[0.68rem] font-headline tracking-wider uppercase border border-white/15 text-[#9A9BA8] hover:text-[#F5A623] hover:border-[#F5A623] transition-colors"
                      >
                        Edit / Modify
                      </button>

                      <button
                        onClick={() => handleReject(f.id)}
                        disabled={actionLoading}
                        className={`px-3 py-1 text-[0.68rem] font-headline tracking-wider uppercase border transition-colors ${
                          f.status === 'REJECTED'
                            ? 'border-[#C45C4A] text-[#C45C4A] bg-[#C45C4A]/10'
                            : 'border-white/15 text-[#9A9BA8] hover:text-white hover:border-[#C45C4A]'
                        }`}
                      >
                        Reject (False Positive)
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 2: STUDENT FEEDBACK PREVIEW */}
        {activeTab === 'STUDENT_PREVIEW' && (
          <div className="mounted-document p-8 md:p-12 space-y-8">
            <div className="flex items-center justify-between border-b border-[rgba(245,166,35,0.18)] pb-4">
              <div>
                <span className="font-mono text-xs text-[#F5A623] tracking-widest uppercase block mb-1">
                  STUDENT VIEWPORT SIMULATION (PRD FR-19 & FR-20)
                </span>
                <h2 className="font-headline text-2xl font-light text-white">
                  Official Feedback as Received by {reviewMeta.student_name}
                </h2>
              </div>

              <div className="text-right">
                <span className={`font-mono text-xs px-3 py-1 border uppercase tracking-wider ${
                  isPublished
                    ? 'border-[#22C55E]/50 text-[#22C55E] bg-[#22C55E]/10'
                    : 'border-[#F5A623]/40 text-[#F5A623] bg-[#F5A623]/10'
                }`}>
                  {isPublished ? 'PUBLISHED & VISIBLE' : 'DRAFT (HIDDEN FROM STUDENT)'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-[#070814] border-l-2 border-[#7B6CFF] text-xs font-mono text-[#A4A5B6]">
              PRD Principle 3.2: Raw AI findings are omitted from this view. Only items explicitly approved by the lecturer appear here.
            </div>

            <div className="space-y-6">
              {allFindings.filter(f => f.status === 'APPROVED' || f.status === 'PUBLISHED').map((item, idx) => (
                <div key={item.id} className="mounted-document-subtle p-6 space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-[#F5A623] font-medium">[{idx + 1}] {item.category}</span>
                    {item.location && <span className="text-[#8A8B98]">{item.location.section}</span>}
                  </div>

                  <div className="p-3 bg-[#070814] border-l-2 border-[#7B6CFF] text-xs space-y-1">
                    <span className="font-headline text-[#7B6CFF] tracking-wider uppercase text-[0.68rem] block font-medium">
                      Supervisor Required Action
                    </span>
                    <p className="text-white font-light">{item.recommendation}</p>
                  </div>
                </div>
              ))}

              {allFindings.filter(f => f.status === 'APPROVED' || f.status === 'PUBLISHED').length === 0 && (
                <div className="text-center py-10 text-xs font-mono text-[#8A8B98]">
                  No findings have been approved for publication yet. Use the "Lecturer Evidence Dossier" tab to approve findings.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success Modal when Publishing Feedback */}
        {publishSuccessModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="w-full max-w-lg mounted-document p-8 space-y-6 text-center border border-[#22C55E]/40">
              <div className="w-14 h-14 rounded-full border border-[#22C55E] flex items-center justify-center mx-auto text-[#22C55E] text-2xl">
                ✓
              </div>
              <div className="space-y-2">
                <span className="font-mono text-xs text-[#22C55E] tracking-widest uppercase">
                  ACADEMIC FEEDBACK PUBLISHED
                </span>
                <h3 className="font-headline text-2xl font-light text-white">
                  Official Feedback Released
                </h3>
                <p className="text-xs text-[#A4A5B6] font-light leading-relaxed">
                  <span className="text-white font-medium">{approvedCount} approved findings</span> have been published to the student portal.
                  Unapproved AI deductions remain strictly confidential to faculty.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-4">
                <button
                  onClick={() => setPublishSuccessModal(false)}
                  className="btn-terracotta px-6 py-2.5 text-xs tracking-wider uppercase cursor-pointer"
                >
                  Return to Dossier
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
