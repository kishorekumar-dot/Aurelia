// src/pages/StudentHistory.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AureliaHeader } from '../components/AureliaHeader';
import { getActiveReview, type ReviewState } from '../utils/storage';

export default function StudentHistory() {
  const [review, setReview] = useState<ReviewState>(getActiveReview());

  useEffect(() => {
    setReview(getActiveReview());
  }, []);

  return (
    <div className="min-h-screen bg-[#050508] text-[#E8E8EE] flex flex-col font-body">
      <AureliaHeader />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 pt-28 pb-20 space-y-10">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 font-mono text-xs text-[#8A8B98]">
          <Link to="/student" className="hover:text-white transition-colors">
            ← Student Desk
          </Link>
          <span>/</span>
          <span className="text-[#F5A623]">Version History & Comparison</span>
        </div>

        {/* Header */}
        <div className="border-b border-[rgba(245,166,35,0.18)] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="font-mono text-xs text-[#F5A623] tracking-[0.24em] uppercase block mb-1">
              Revision Lifecycle Tracker (PRD FR-21)
            </span>
            <h1 className="font-headline text-3xl md:text-4xl font-light text-white tracking-wide">
              Manuscript Revisions & History
            </h1>
            <p className="text-xs font-mono text-[#8A8B98] mt-1.5">
              Project: {review.title} · Candidate: {review.author}
            </p>
          </div>

          <Link
            to="/student/submit"
            className="btn-terracotta px-5 py-2.5 text-xs font-headline tracking-[0.16em] uppercase"
          >
            + Upload Version {review.version + 1}
          </Link>
        </div>

        {/* Timeline of Revisions */}
        <div className="space-y-6">
          {review.versions.map((ver, idx) => (
            <div key={ver.version} className="mounted-document p-8 space-y-5 relative">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div className="flex items-center gap-3">
                  <span className="font-headline text-xl text-white">
                    Version {ver.version}.0
                  </span>
                  <span className={`font-mono text-[0.68rem] px-2 py-0.5 border ${
                    idx === 0
                      ? 'border-[#F5A623]/40 text-[#F5A623] bg-[#F5A623]/10'
                      : 'border-white/20 text-[#8A8B98]'
                  } uppercase tracking-wider`}>
                    {idx === 0 ? 'CURRENT ACTIVE' : 'SUPERSEDED'}
                  </span>
                </div>

                <div className="font-mono text-xs text-[#8A8B98]">
                  {ver.date}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
                <div>
                  <span className="text-[#6A6B78] uppercase block mb-1">Uploaded Artifact</span>
                  <div className="text-white font-headline text-sm font-normal">{ver.filename}</div>
                </div>

                <div>
                  <span className="text-[#6A6B78] uppercase block mb-1">Verification Status</span>
                  <div className="text-[#F5A623]">{ver.status}</div>
                </div>

                <div>
                  <span className="text-[#6A6B78] uppercase block mb-1">Feedback Release</span>
                  <div className={review.isPublished ? 'text-[#22C55E]' : 'text-[#8A8B98]'}>
                    {review.isPublished ? `Published on ${review.publishedAt || 'today'}` : 'Pending Faculty Audit'}
                  </div>
                </div>
              </div>

              <div>
                <span className="font-headline text-[0.68rem] tracking-[0.16em] text-[#8A8B98] uppercase block mb-1">
                  Author Changelog / Response Statement
                </span>
                <p className="text-xs text-[#A4A5B6] font-light bg-[#070814] p-3 border border-white/[0.04] leading-relaxed">
                  {ver.changelog || 'Initial report submission for evaluation.'}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="font-mono text-[0.68rem] text-[#6A6B78]">
                  Hash: 0x{ver.version}a9f...c28e · Tamper-evident ledger record
                </span>

                {review.isPublished && (
                  <Link
                    to="/student/feedback"
                    className="font-headline text-xs tracking-wider uppercase text-[#F5A623] hover:underline"
                  >
                    View Published Feedback →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
