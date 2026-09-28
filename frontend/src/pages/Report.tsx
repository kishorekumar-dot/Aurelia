// src/pages/Report.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AureliaHeader } from '../components/AureliaHeader';
import { 
  getActiveReview, 
  updateFindingStatus, 
  publishReviewFeedback, 
  type ReviewState, 
  type StoredFinding 
} from '../utils/storage';

export default function Report() {
  const [review, setReview] = useState<ReviewState>(getActiveReview());
  const [activeTab, setActiveTab] = useState<'DOSSIER' | 'STUDENT_PREVIEW' | 'VERSION_DIFF'>('DOSSIER');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'VERIFIED' | 'NEEDS_REVIEW' | 'CONTRADICTED' | 'APPROVED' | 'REJECTED'>('ALL');
  
  // State for editing a finding
  const [editingFindingId, setEditingFindingId] = useState<string | number | null>(null);
  const [editRecommendation, setEditRecommendation] = useState('');
  const [editSeverity, setEditSeverity] = useState<'CRITICAL' | 'MAJOR' | 'MINOR' | 'INFO'>('MINOR');
  const [lecturerNote, setLecturerNote] = useState('');
  
  // Publish modal state
  const [publishSuccessModal, setPublishSuccessModal] = useState(false);

  useEffect(() => {
    setReview(getActiveReview());
  }, []);

  const handleAction = (id: string | number, status: StoredFinding['status'], comment?: string) => {
    const updated = updateFindingStatus(id, status, comment);
    setReview(updated);
  };

  const handleStartEdit = (f: StoredFinding) => {
    setEditingFindingId(f.id);
    setEditRecommendation(f.recommendation);
    setEditSeverity(f.severity);
    setLecturerNote(f.lecturerComment || '');
  };

  const handleSaveEdit = (id: string | number) => {
    const current = getActiveReview();
    current.findings = current.findings.map(f => {
      if (f.id === id) {
        return {
          ...f,
          recommendation: editRecommendation,
          severity: editSeverity,
          lecturerComment: lecturerNote,
          status: 'MODIFIED' as const
        };
      }
      return f;
    });
    // Save to storage
    localStorage.setItem('aurelia_active_review_v1', JSON.stringify(current));
    setReview(current);
    setEditingFindingId(null);
  };

  const handlePublish = () => {
    const updated = publishReviewFeedback();
    setReview(updated);
    setPublishSuccessModal(true);
  };

  const handleExportDossier = () => {
    const blob = new Blob([JSON.stringify(review, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Aurelia_Lecturer_Dossier_${review.reviewId}_v${review.version}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter findings
  const filteredFindings = review.findings.filter((f) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'VERIFIED') return f.status === 'VERIFIED' || f.authority === 'AUTOMATIC';
    if (selectedFilter === 'NEEDS_REVIEW') return f.status === 'NEEDS_REVIEW' || f.authority === 'LECTURER';
    if (selectedFilter === 'CONTRADICTED') return f.status === 'CONTRADICTED';
    if (selectedFilter === 'APPROVED') return f.status === 'APPROVED' || f.status === 'PUBLISHED';
    if (selectedFilter === 'REJECTED') return f.status === 'REJECTED';
    return true;
  });

  const approvedCount = review.findings.filter(f => f.status === 'APPROVED' || f.status === 'PUBLISHED').length;

  return (
    <div className="min-h-screen bg-[#050508] text-[#E8E8EE] flex flex-col font-body">
      <AureliaHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pt-28 pb-20 space-y-10">
        
        {/* Top Control Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[rgba(245,166,35,0.18)] pb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-xs text-[#F5A623] tracking-[0.24em] uppercase block">
                Folio Evaluation Record #{review.reviewId} · Version {review.version}.0
              </span>
              {review.isPublished ? (
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
              {review.title}
            </h1>
            <p className="text-xs font-mono text-[#8A8B98] mt-1.5">
              Candidate: <span className="text-white">{review.author}</span> · {review.department} · Submitted {review.submissionDate}
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

            {/* Crucial PRD Action: Publish Feedback to Student */}
            <button
              onClick={handlePublish}
              className={`px-6 py-2.5 text-xs font-headline tracking-[0.18em] uppercase transition-all shadow-lg ${
                review.isPublished
                  ? 'border border-[#22C55E]/50 text-[#22C55E] bg-[#22C55E]/10 cursor-default'
                  : 'btn-terracotta cursor-pointer'
              }`}
            >
              {review.isPublished ? '✓ Published to Candidate' : 'Publish Feedback to Student →'}
            </button>
          </div>
        </div>

        {/* View Switcher Tabs: Lecturer Dossier vs Student Feedback Preview vs Version Comparison */}
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
          <button
            onClick={() => setActiveTab('VERSION_DIFF')}
            className={`font-headline text-xs tracking-[0.18em] uppercase py-3 px-5 border-b-2 transition-colors ${
              activeTab === 'VERSION_DIFF'
                ? 'border-[#F5A623] text-white bg-white/[0.02]'
                : 'border-transparent text-[#8A8B98] hover:text-white'
            }`}
          >
            Version Comparison (PRD FR-21)
          </button>
        </div>

        {/* TAB 1: LECTURER EVIDENCE DOSSIER */}
        {activeTab === 'DOSSIER' && (
          <div className="space-y-10">
            {/* Header Strip with 4 Scores & Routing Badge */}
            <div className="mounted-document p-8 space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-6 border-b border-[rgba(245,166,35,0.18)]">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                  <div>
                    <span className="font-headline text-[0.68rem] tracking-[0.18em] text-[#8A8B98] uppercase block mb-1">
                      Format Score (20%)
                    </span>
                    <div className="font-mono text-3xl font-light text-white">
                      {review.formatScore}<span className="text-sm text-[#6A6B78]">/100</span>
                    </div>
                  </div>
                  <div>
                    <span className="font-headline text-[0.68rem] tracking-[0.18em] text-[#8A8B98] uppercase block mb-1">
                      Content Score (40%)
                    </span>
                    <div className="font-mono text-3xl font-light text-[#F5A623]">
                      {review.contentScore}<span className="text-sm text-[#6A6B78]">/100</span>
                    </div>
                  </div>
                  <div>
                    <span className="font-headline text-[0.68rem] tracking-[0.18em] text-[#8A8B98] uppercase block mb-1">
                      Innovation Score (25%)
                    </span>
                    <div className="font-mono text-3xl font-light text-[#7B6CFF]">
                      {review.innovationScore}<span className="text-sm text-[#6A6B78]">/100</span>
                    </div>
                  </div>
                  <div>
                    <span className="font-headline text-[0.68rem] tracking-[0.18em] text-[#8A8B98] uppercase block mb-1">
                      Confidence Delta
                    </span>
                    <div className="font-mono text-3xl font-light text-[#6EC8FF]">
                      {review.confidenceScore}<span className="text-sm text-[#6A6B78]">%</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start lg:items-end">
                  <span className="font-headline text-[0.68rem] tracking-[0.18em] text-[#8A8B98] uppercase mb-1">
                    PRD Governance Routing (FR-16)
                  </span>
                  <div className="font-mono text-xs tracking-widest px-4 py-2 border border-[#F5A623] text-[#F5A623] bg-[#F5A623]/10">
                    {review.routingDecision === 'AUTOMATIC' ? 'LEVEL 3: AUTOMATIC PASS' : 'LEVEL 1: LECTURER AUDIT REQUIRED'}
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
                  Showing {filteredFindings.length} of {review.findings.length} findings
                </span>
              </div>
            </div>

            {/* Findings List with Structured Evidence */}
            <div className="space-y-6">
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
                    <div className="flex items-center gap-3 font-mono text-xs">
                      <span className="text-[#F5A623] font-medium tracking-wider">
                        [{f.id}] {f.agent}
                      </span>
                      <span className="text-[#8A8B98]">·</span>
                      <span className="text-[#8A8B98]">{f.citation}</span>
                      <span className="text-[#8A8B98]">·</span>
                      <span className={`uppercase px-2 py-0.5 border text-[0.65rem] ${
                        f.severity === 'CRITICAL' ? 'border-[#EF4444]/40 text-[#EF4444] bg-[#EF4444]/10' :
                        f.severity === 'MAJOR' ? 'border-[#F5A623]/40 text-[#F5A623] bg-[#F5A623]/10' :
                        'border-white/20 text-[#8A8B98]'
                      }`}>
                        {f.severity}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Authority Tag (PRD FR-16) */}
                      <span className="font-mono text-[0.68rem] text-[#7B6CFF] tracking-wider uppercase">
                        {f.authority === 'AUTOMATIC' ? 'LEVEL 3 · AUTOMATIC' :
                         f.authority === 'QUALIFIED_AI' ? 'LEVEL 2 · QUALIFIED AI' : 'LEVEL 1 · LECTURER JUDGMENT'}
                      </span>

                      {/* Status Badge */}
                      <span className={`font-mono text-[0.68rem] tracking-wider px-2.5 py-0.5 border uppercase ${
                        f.status === 'PUBLISHED' ? 'border-[#22C55E]/50 text-[#22C55E] bg-[#22C55E]/10' :
                        f.status === 'APPROVED' ? 'border-[#22C55E]/40 text-[#22C55E] bg-[#22C55E]/10' :
                        f.status === 'CONTRADICTED' ? 'border-[#EF4444]/40 text-[#EF4444] bg-[#EF4444]/10' :
                        f.status === 'REJECTED' ? 'border-white/20 text-[#8A8B98]' :
                        'border-[#F5A623]/40 text-[#F5A623] bg-[#F5A623]/10'
                      }`}>
                        STATUS: {f.status}
                      </span>
                    </div>
                  </div>

                  {/* Document Excerpt Pull-Quote */}
                  <div>
                    <span className="font-headline text-[0.68rem] tracking-[0.16em] text-[#8A8B98] uppercase block mb-1">
                      Document Excerpt Under Audit
                    </span>
                    <blockquote className="border-l-2 border-[#F5A623] pl-4 py-2 font-mono text-sm text-[#E2E2EC] italic leading-relaxed bg-[#070814]/70 p-3">
                      "{f.quote}"
                    </blockquote>
                  </div>

                  {/* Structured Evidence Card (PRD FR-12) */}
                  <div className="mounted-document-subtle p-5 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between text-[#8A8B98] border-b border-white/[0.06] pb-2">
                      <span className="text-[#F5A623] uppercase tracking-wider text-[0.7rem] font-medium">
                        Structured Evidence Extraction (PRD Section 15)
                      </span>
                      <span>Confidence: {(f.evidence.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[#A4A5B6]">
                      <div>
                        <span className="text-[#6A6B78] uppercase block text-[0.65rem]">Extraction Method:</span>
                        <span>{f.evidence.method}</span>
                      </div>
                      <div>
                        <span className="text-[#6A6B78] uppercase block text-[0.65rem]">Source Anchor:</span>
                        <span>{f.evidence.source}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[#6A6B78] uppercase block text-[0.65rem]">Empirical Observation:</span>
                      <p className="text-white mt-0.5 leading-relaxed">{f.evidence.observation}</p>
                    </div>
                    <div className="pt-2 border-t border-white/[0.06] flex items-center gap-2">
                      <span className="text-[#F5A623] font-medium">APPLICABLE RULE [{f.policy_id}]:</span>
                      <span className="text-[#9A9BA8]">{f.policy_rule}</span>
                    </div>
                  </div>

                  {/* Current Recommendation & Verdict */}
                  <div className="space-y-1 text-xs">
                    <span className="font-headline text-[0.68rem] tracking-[0.16em] text-[#7B6CFF] uppercase block">
                      Proposed Student Recommendation
                    </span>
                    <p className="text-white font-light leading-relaxed">
                      {f.recommendation}
                    </p>
                    {f.lecturerComment && (
                      <div className="mt-2 text-xs font-mono text-[#F5A623]">
                        Lecturer Annotation: "{f.lecturerComment}"
                      </div>
                    )}
                  </div>

                  {/* Inline Edit Form if this finding is being edited */}
                  {editingFindingId === f.id && (
                    <div className="p-5 bg-[#080916] border border-[#F5A623]/40 space-y-4 font-mono text-xs">
                      <span className="text-[#F5A623] font-headline uppercase tracking-wider text-xs block">
                        Edit Finding & Recommendation (PRD Section 18)
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
                            onChange={(e) => setEditSeverity(e.target.value as any)}
                            className="w-full bg-[#050508] border border-white/20 p-2 text-white"
                          >
                            <option value="CRITICAL">CRITICAL</option>
                            <option value="MAJOR">MAJOR</option>
                            <option value="MINOR">MINOR</option>
                            <option value="INFO">INFO</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[#8A8B98] mb-1">Internal Lecturer Note / Viva Query:</label>
                          <input
                            type="text"
                            value={lecturerNote}
                            onChange={(e) => setLecturerNote(e.target.value)}
                            placeholder="Optional note for candidate oral defense..."
                            className="w-full bg-[#050508] border border-white/20 p-2 text-white"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => handleSaveEdit(f.id)}
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

                  {/* Lecturer Action Buttons Bar (PRD Section 18) */}
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
                        onClick={() => handleAction(f.id, 'APPROVED')}
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
                        className="px-3 py-1 text-[0.68rem] font-headline tracking-wider uppercase border border-white/15 text-[#9A9BA8] hover:text-[#F5A623] hover:border-[#F5A623] transition-colors"
                      >
                        Edit / Modify
                      </button>

                      <button
                        onClick={() => handleAction(f.id, 'REJECTED')}
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

            {/* Viva Voce Interrogation Bank (PRD FR-23) */}
            <div className="mounted-document p-8 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <h3 className="font-headline text-lg font-light text-white tracking-wide">
                  Automated Viva Voce Interrogation Bank (PRD FR-23)
                </h3>
                <span className="font-mono text-xs text-[#F5A623]">FACULTY SUGGESTIONS</span>
              </div>
              <div className="space-y-3 font-mono text-xs">
                <div className="p-4 bg-[#070814] border border-white/10 space-y-1">
                  <span className="text-[#F5A623] block">[Q1 · METHODOLOGY DELTA]</span>
                  <p className="text-[#A4A5B6]">
                    "How does the edge sensor Poisson queue latency model account for intermittent wireless packet drops during peak duty cycles?"
                  </p>
                </div>
                <div className="p-4 bg-[#070814] border border-white/10 space-y-1">
                  <span className="text-[#F5A623] block">[Q2 · REPRODUCIBILITY & DATASETS]</span>
                  <p className="text-[#A4A5B6]">
                    "The text claims the 142k sensor reading dataset is publicly hosted; please provide the persistent DOI or explain data accessibility protocols."
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STUDENT FEEDBACK PREVIEW (PRD FR-20) */}
        {activeTab === 'STUDENT_PREVIEW' && (
          <div className="mounted-document p-8 md:p-12 space-y-8">
            <div className="flex items-center justify-between border-b border-[rgba(245,166,35,0.18)] pb-4">
              <div>
                <span className="font-mono text-xs text-[#F5A623] tracking-widest uppercase block mb-1">
                  STUDENT VIEWPORT SIMULATION (PRD FR-19 & FR-20)
                </span>
                <h2 className="font-headline text-2xl font-light text-white">
                  Official Feedback as Received by {review.author}
                </h2>
              </div>

              <div className="text-right">
                <span className={`font-mono text-xs px-3 py-1 border uppercase tracking-wider ${
                  review.isPublished
                    ? 'border-[#22C55E]/50 text-[#22C55E] bg-[#22C55E]/10'
                    : 'border-[#F5A623]/40 text-[#F5A623] bg-[#F5A623]/10'
                }`}>
                  {review.isPublished ? 'PUBLISHED & VISIBLE' : 'DRAFT (HIDDEN FROM STUDENT)'}
                </span>
              </div>
            </div>

            {/* Note on PRD Principle 3.2 */}
            <div className="p-4 bg-[#070814] border-l-2 border-[#7B6CFF] text-xs font-mono text-[#A4A5B6]">
              PRD Principle 3.2: Raw AI findings are omitted from this view. Only items explicitly approved by the lecturer appear here.
            </div>

            <div className="space-y-6">
              {review.findings.filter(f => f.status === 'APPROVED' || f.status === 'PUBLISHED').map((item, idx) => (
                <div key={item.id} className="mounted-document-subtle p-6 space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-[#F5A623] font-medium">
                      [{idx + 1}] ITEM {item.id} · {item.category}
                    </span>
                    <span className="text-[#8A8B98]">{item.citation}</span>
                  </div>

                  <blockquote className="border-l-2 border-[#F5A623] pl-3 py-1 font-mono text-xs text-[#E2E2EC] italic">
                    "{item.quote}"
                  </blockquote>

                  <div className="p-3 bg-[#070814] border-l-2 border-[#7B6CFF] text-xs space-y-1">
                    <span className="font-headline text-[#7B6CFF] tracking-wider uppercase text-[0.68rem] block font-medium">
                      Supervisor Required Action
                    </span>
                    <p className="text-white font-light">{item.recommendation}</p>
                    {item.lecturerComment && (
                      <p className="text-[#F5A623] font-mono text-[0.72rem] mt-1">
                        Supervisor Note: "{item.lecturerComment}"
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {review.findings.filter(f => f.status === 'APPROVED' || f.status === 'PUBLISHED').length === 0 && (
                <div className="text-center py-10 text-xs font-mono text-[#8A8B98]">
                  No findings have been approved for publication yet. Use the "Lecturer Evidence Dossier" tab to approve findings.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: VERSION COMPARISON (PRD FR-21) */}
        {activeTab === 'VERSION_DIFF' && (
          <div className="mounted-document p-8 md:p-12 space-y-8">
            <div className="border-b border-[rgba(245,166,35,0.18)] pb-4">
              <span className="font-mono text-xs text-[#F5A623] tracking-widest uppercase block mb-1">
                PRD FR-21 · Revision Comparison Engine
              </span>
              <h2 className="font-headline text-2xl font-light text-white">
                Version Timeline & Comparison
              </h2>
            </div>

            <div className="space-y-6">
              {review.versions.map((ver) => (
                <div key={ver.version} className="mounted-document-subtle p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-headline text-lg text-white">
                        Version {ver.version}.0
                      </span>
                      <span className="font-mono text-xs text-[#F5A623]">
                        {ver.filename}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-[#8A8B98]">{ver.date}</span>
                  </div>

                  <div className="font-mono text-xs text-[#A4A5B6]">
                    <span className="text-[#6A6B78] uppercase block mb-1 text-[0.68rem]">Author Revision Changelog:</span>
                    <p className="bg-[#070814] p-3 border border-white/[0.04] text-white">
                      {ver.changelog || 'Initial complete manuscript submission.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success Modal when Publishing Feedback */}
        {publishSuccessModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="w-full max-w-lg mounted-document p-8 space-y-6 text-center border border-[#22C55E]/40 animate-in fade-in zoom-in-95">
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
                  In compliance with PRD Principle 3.2, <span className="text-white font-medium">{approvedCount} approved findings</span> have been published to <span className="text-white font-medium">{review.author}</span>'s student portal.
                  Unapproved and internal AI deductions remain strictly confidential to faculty.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-4">
                <button
                  onClick={() => setPublishSuccessModal(false)}
                  className="btn-terracotta px-6 py-2.5 text-xs tracking-wider uppercase cursor-pointer"
                >
                  Return to Dossier
                </button>
                <Link
                  to="/student/feedback"
                  className="px-6 py-2.5 border border-white/20 text-xs font-mono text-white hover:border-[#F5A623] transition-colors"
                >
                  View as Student →
                </Link>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
