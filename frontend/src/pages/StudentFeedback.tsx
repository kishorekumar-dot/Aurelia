// src/pages/StudentFeedback.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AureliaHeader } from '../components/AureliaHeader';
import { getActiveReview, type ReviewState } from '../utils/storage';

export default function StudentFeedback() {
  const [review, setReview] = useState<ReviewState>(getActiveReview());

  useEffect(() => {
    setReview(getActiveReview());
  }, []);

  // Filter only published or approved findings when published
  const approvedFeedback = review.findings.filter(f => 
    review.isPublished && (f.status === 'PUBLISHED' || f.status === 'APPROVED')
  );

  const handleExportStudentReport = () => {
    const reportData = {
      product: "AURELIA Academic Unified Review Engine",
      report_type: "Official Student Correction Feedback",
      candidate: review.author,
      project_title: review.title,
      supervisor: "Dr. Evelyn Chen",
      publication_date: review.publishedAt || new Date().toISOString(),
      version: review.version,
      required_actions: approvedFeedback.map(f => ({
        id: f.id,
        category: f.category,
        severity: f.severity,
        location: f.location,
        issue: f.quote,
        guideline_rule: f.policy_rule,
        supervisor_recommendation: f.recommendation,
        evidence: f.evidence.observation
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Aurelia_Feedback_${review.author.replace(' ', '_')}_v${review.version}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#050508] text-[#E8E8EE] flex flex-col font-body">
      <AureliaHeader />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 pt-28 pb-20 space-y-10">
        
        {/* Breadcrumb Strip */}
        <div className="flex items-center gap-2 font-mono text-xs text-[#8A8B98]">
          <Link to="/student" className="hover:text-white transition-colors">
            ← Student Desk
          </Link>
          <span>/</span>
          <span className="text-[#F5A623]">Official Lecturer Feedback</span>
        </div>

        {/* Header Header */}
        <div className="border-b border-[rgba(245,166,35,0.18)] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="font-mono text-xs text-[#F5A623] tracking-[0.24em] uppercase block mb-1">
              Official Academic Assessment · Version {review.version}.0
            </span>
            <h1 className="font-headline text-3xl md:text-4xl font-light text-white tracking-wide">
              Lecturer-Approved Feedback
            </h1>
            <p className="text-xs font-mono text-[#8A8B98] mt-1.5">
              Verified by Supervisor: <span className="text-white">Dr. Evelyn Chen</span> · Published {review.publishedAt || '18 SEP 2026'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportStudentReport}
              className="px-5 py-2.5 border border-white/15 text-xs font-headline tracking-[0.16em] uppercase text-[#9A9BA8] hover:text-white hover:border-white/40 transition-colors"
            >
              Export Report JSON
            </button>
            <Link
              to="/student/submit"
              className="btn-terracotta px-5 py-2.5 text-xs font-headline tracking-[0.16em] uppercase"
            >
              Submit Revision →
            </Link>
          </div>
        </div>

        {/* Condition 1: If Feedback is NOT yet published by the lecturer */}
        {!review.isPublished ? (
          <div className="mounted-document p-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-full border border-[rgba(245,166,35,0.4)] flex items-center justify-center mx-auto">
              <div className="w-4 h-4 rounded-full bg-[#F5A623] animate-pulse" />
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              <span className="font-mono text-xs text-[#F5A623] tracking-widest uppercase">
                SUPERVISOR AUDIT IN PROGRESS
              </span>
              <h2 className="font-headline text-2xl font-light text-white">
                Feedback Pending Publication
              </h2>
              <p className="text-xs text-[#A4A5B6] font-light leading-relaxed">
                In strict adherence to <span className="text-[#F5A623]">PRD Principle 3.2</span>, raw AI findings remain private to your supervisor. 
                Dr. Evelyn Chen is currently reviewing the automated evidence and formulating official guidance.
              </p>
            </div>
            <div className="pt-4 border-t border-white/[0.06] font-mono text-xs text-[#8A8B98]">
              Submitted Version {review.version}.0 on {review.submissionDate} · Status: Under Lecturer Review
            </div>
          </div>
        ) : (
          /* Condition 2: Feedback IS published by the lecturer */
          <div className="space-y-8">
            
            {/* Summary Banner */}
            <div className="mounted-document-subtle p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-2 border-[#22C55E]">
              <div>
                <span className="font-mono text-[0.68rem] text-[#22C55E] tracking-widest uppercase block mb-1">
                  OFFICIAL ACTION PLAN RELEASED
                </span>
                <div className="font-headline text-lg font-light text-white">
                  {approvedFeedback.length} Approved Action Items to Complete for Oral Defense
                </div>
              </div>
              <div className="font-mono text-xs text-[#8A8B98]">
                Authority: <span className="text-white">Dr. Evelyn Chen</span>
              </div>
            </div>

            {/* List of Approved Findings */}
            <div className="space-y-6">
              {approvedFeedback.map((item, index) => (
                <div
                  key={item.id}
                  className="mounted-document p-8 space-y-5 relative overflow-hidden"
                >
                  {/* Top Header Mark */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                    <div className="flex items-center gap-3 font-mono text-xs">
                      <span className="text-[#F5A623] font-medium">
                        [{index + 1}] ITEM {item.id}
                      </span>
                      <span className="text-[#8A8B98]">·</span>
                      <span className="text-white uppercase font-headline tracking-wider text-[0.72rem]">
                        {item.category} COMPLIANCE
                      </span>
                      <span className="text-[#8A8B98]">·</span>
                      <span className="text-[#8A8B98]">{item.citation}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-[0.65rem] tracking-wider px-2 py-0.5 border ${
                        item.severity === 'CRITICAL' ? 'border-[#EF4444]/40 text-[#EF4444] bg-[#EF4444]/10' :
                        item.severity === 'MAJOR' ? 'border-[#F5A623]/40 text-[#F5A623] bg-[#F5A623]/10' :
                        'border-white/20 text-[#A4A5B6] bg-white/[0.04]'
                      } uppercase`}>
                        {item.severity}
                      </span>
                      <span className="font-mono text-[0.65rem] px-2 py-0.5 border border-[#22C55E]/40 text-[#22C55E] bg-[#22C55E]/10 uppercase tracking-wider">
                        APPROVED BY FACULTY
                      </span>
                    </div>
                  </div>

                  {/* Document Quotation */}
                  <div>
                    <span className="font-headline text-[0.68rem] tracking-[0.16em] text-[#8A8B98] uppercase block mb-1">
                      Document Excerpt
                    </span>
                    <blockquote className="border-l-2 border-[#F5A623] pl-4 py-1 font-mono text-xs text-[#E2E2EC] italic leading-relaxed bg-[#070814]/60 p-2">
                      "{item.quote}"
                    </blockquote>
                  </div>

                  {/* Verified Evidentiary Observation */}
                  <div className="font-mono text-xs space-y-1">
                    <span className="text-[#8A8B98] text-[0.68rem] tracking-widest uppercase block">
                      Evidentiary Basis
                    </span>
                    <p className="text-[#A4A5B6] leading-relaxed">
                      {item.evidence.observation}
                    </p>
                  </div>

                  {/* Institutional Rule */}
                  <div className="p-3 bg-[#080916] border border-white/[0.06] font-mono text-xs flex items-start gap-2">
                    <span className="text-[#F5A623] font-medium shrink-0">POLICY {item.policy_id}:</span>
                    <span className="text-[#9A9BA8]">{item.policy_rule}</span>
                  </div>

                  {/* Lecturer Actionable Recommendation */}
                  <div className="p-4 bg-[#0A0B1A] border-l-2 border-[#7B6CFF] space-y-1 font-body">
                    <span className="font-headline text-xs text-[#7B6CFF] tracking-[0.18em] uppercase block font-medium">
                      Supervisor Required Action
                    </span>
                    <p className="text-sm text-white font-light leading-relaxed">
                      {item.recommendation}
                    </p>
                    {item.lecturerComment && (
                      <div className="pt-2 text-xs font-mono text-[#F5A623]">
                        Note from Dr. Chen: "{item.lecturerComment}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Resubmit Action Strip */}
            <div className="mounted-document p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border-t-2 border-[rgba(245,166,35,0.4)]">
              <div>
                <h3 className="font-headline text-xl font-light text-white">
                  Ready to Resubmit Corrections?
                </h3>
                <p className="text-xs text-[#8A8B98] font-light mt-1">
                  Once you apply the required figure, bibliography, or methodological changes, upload Version {review.version + 1}.0.
                </p>
              </div>

              <Link
                to="/student/submit"
                className="btn-terracotta px-7 py-3 text-xs tracking-[0.2em] uppercase shrink-0"
              >
                Upload Revision v{review.version + 1}.0 →
              </Link>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
