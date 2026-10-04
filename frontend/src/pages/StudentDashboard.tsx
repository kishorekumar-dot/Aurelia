// src/pages/StudentDashboard.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AureliaHeader } from '../components/AureliaHeader';
import { getActiveReview, type ReviewState } from '../utils/storage';

export default function StudentDashboard() {
  const [review, setReview] = useState<ReviewState>(getActiveReview());
  const [candidateName, setCandidateName] = useState<string>('Alex Rivera');
  const [candidateDept, setCandidateDept] = useState<string>('Computer Science & AI');

  useEffect(() => {
    try {
      const auth = localStorage.getItem('aurelia_auth');
      if (auth) {
        const parsed = JSON.parse(auth);
        if (parsed.name) setCandidateName(parsed.name);
        if (parsed.department) setCandidateDept(parsed.department);
      }
    } catch {}
    setReview(getActiveReview());
  }, []);

  const publishedCount = review.findings.filter(f => f.status === 'PUBLISHED' || (review.isPublished && f.status === 'APPROVED')).length;

  return (
    <div className="min-h-screen bg-[#050508] text-[#E8E8EE] flex flex-col font-body">
      <AureliaHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pt-28 pb-16 space-y-10">
        
        {/* Top Student Banner & Assigned Supervisor */}
        <div className="border-b border-[rgba(245,166,35,0.18)] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-xs text-[#F5A623] tracking-[0.24em] uppercase block">
                Candidate: {candidateName} · Reg. No: CS-2024-8831
              </span>
              <span className="font-mono text-[0.65rem] px-2 py-0.5 border border-[#7B6CFF]/40 text-[#7B6CFF] bg-[#7B6CFF]/10 uppercase">
                Active Candidate
              </span>
            </div>
            <h1 className="font-headline text-3xl md:text-4xl font-light text-white tracking-wide">
              {review.title}
            </h1>
            <p className="text-xs font-mono text-[#8A8B98] mt-1.5">
              Assigned Supervisor: <span className="text-white">Dr. Evelyn Chen</span> · {candidateDept}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/student/submit"
              className="btn-terracotta px-6 py-2.5 text-xs font-headline tracking-[0.16em] uppercase"
            >
              + Submit New Revision (v{review.version + 1})
            </Link>
          </div>
        </div>

        {/* PRD Principle Notice: Academic Integrity Guarantee */}
        <div className="mounted-document-subtle p-4 border-l-2 border-[#F5A623] flex items-start gap-4">
          <div className="w-5 h-5 rounded-full border border-[#F5A623] flex items-center justify-center shrink-0 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-[#F5A623]" />
          </div>
          <div className="text-xs font-light text-[#A4A5B6] space-y-1">
            <div className="font-headline text-white tracking-wider uppercase text-[0.7rem]">
              Academic Governance Protocol (PRD Principle 3.2)
            </div>
            <p>
              In accordance with university assessment standards, raw AI findings remain confidential to your supervisor.
              You will only receive feedback that has been personally reviewed, verified, and officially published by <span className="text-white font-medium">Dr. Evelyn Chen</span>.
            </p>
          </div>
        </div>

        {/* Primary Status Grid: 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Latest Submission Status */}
          <div className="mounted-document p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-headline text-[0.68rem] tracking-[0.18em] text-[#8A8B98] uppercase">
                Current Manuscript
              </span>
              <span className="font-mono text-xs text-[#F5A623]">
                Version {review.version}.0
              </span>
            </div>
            <div>
              <div className="font-headline text-2xl font-light text-white">
                {review.versions[0]?.filename || 'report_final.pdf'}
              </div>
              <div className="font-mono text-xs text-[#6A6B78] mt-1">
                Submitted on {review.versions[0]?.date || review.submissionDate}
              </div>
            </div>
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <span className="font-mono text-[0.68rem] text-[#8A8B98]">Manuscript Status</span>
              <span className="font-mono text-[0.68rem] tracking-wider px-2.5 py-0.5 border border-[#F5A623]/30 text-[#F5A623] bg-[#F5A623]/10 uppercase">
                {review.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Card 2: Published Feedback Status */}
          <div className="mounted-document p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-headline text-[0.68rem] tracking-[0.18em] text-[#8A8B98] uppercase">
                Lecturer Assessment
              </span>
              <span className={`font-mono text-[0.68rem] px-2 py-0.5 border ${
                review.isPublished 
                  ? 'border-[#22C55E]/40 text-[#22C55E] bg-[#22C55E]/10' 
                  : 'border-[#F5A623]/40 text-[#F5A623] bg-[#F5A623]/10'
              } uppercase tracking-wider`}>
                {review.isPublished ? 'PUBLISHED' : 'IN AUDIT'}
              </span>
            </div>
            <div>
              <div className="font-headline text-2xl font-light text-white">
                {review.isPublished ? `${publishedCount} Action Items` : 'Pending Publication'}
              </div>
              <div className="font-mono text-xs text-[#6A6B78] mt-1">
                {review.isPublished 
                  ? `Published by supervisor on ${review.publishedAt || 'today'}`
                  : 'Supervisor is reviewing automated evidence.'}
              </div>
            </div>
            <div className="pt-3 border-t border-white/[0.06]">
              {review.isPublished ? (
                <Link
                  to="/student/feedback"
                  className="font-headline text-[0.72rem] tracking-[0.16em] uppercase text-[#F5A623] hover:underline flex items-center justify-between"
                >
                  <span>Inspect Official Feedback</span>
                  <span>→</span>
                </Link>
              ) : (
                <span className="font-mono text-[0.68rem] text-[#6A6B78]">
                  Notification will arrive once feedback is released
                </span>
              )}
            </div>
          </div>

          {/* Card 3: Next Actions & Resubmission */}
          <div className="mounted-document p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-headline text-[0.68rem] tracking-[0.18em] text-[#8A8B98] uppercase">
                Revision Target
              </span>
              <span className="font-mono text-xs text-[#7B6CFF]">
                Target: Final Oral Defense
              </span>
            </div>
            <div>
              <div className="font-headline text-2xl font-light text-white">
                {review.isPublished ? 'Corrections Ready' : 'Await Faculty'}
              </div>
              <div className="font-mono text-xs text-[#6A6B78] mt-1">
                {review.isPublished 
                  ? 'Address the required figure and bibliography items.'
                  : 'Prepare responses to methodological queries.'}
              </div>
            </div>
            <div className="pt-3 border-t border-white/[0.06]">
              <Link
                to="/student/submit"
                className="font-headline text-[0.72rem] tracking-[0.16em] uppercase text-[#7B6CFF] hover:underline flex items-center justify-between"
              >
                <span>Upload Corrected Version</span>
                <span>→</span>
              </Link>
            </div>
          </div>

        </div>

        {/* Submission Version Ledger */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-lg font-light text-white tracking-wide">
              Manuscript Version History & Audit Trail
            </h2>
            <Link
              to="/student/history"
              className="font-mono text-xs text-[#F5A623] hover:underline"
            >
              Detailed Version Comparison →
            </Link>
          </div>

          <div className="mounted-document p-0 overflow-hidden">
            <table className="w-full text-left border-collapse font-body">
              <thead>
                <tr className="border-b border-[rgba(245,166,35,0.18)] bg-[#070814] font-headline text-[0.68rem] tracking-[0.18em] uppercase text-[#7A7B8A]">
                  <th className="py-3.5 px-4">Version</th>
                  <th className="py-3.5 px-4">Uploaded File</th>
                  <th className="py-3.5 px-4">Date / Time</th>
                  <th className="py-3.5 px-4">Supervisor Action</th>
                  <th className="py-3.5 px-4">Feedback Status</th>
                  <th className="py-3.5 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {review.versions.map((ver) => (
                  <tr key={ver.version} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 font-mono text-xs text-[#F5A623]">
                      v{ver.version}.0
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-headline text-sm text-white">
                        {ver.filename}
                      </div>
                      <div className="font-mono text-[0.68rem] text-[#6A6B78] max-w-md truncate">
                        {ver.changelog || 'Initial report submission for evaluation.'}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-[#8A8B98]">
                      {ver.date}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-mono text-xs text-[#A4A5B6]">
                        Dr. Evelyn Chen
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {review.isPublished ? (
                        <span className="inline-block font-mono text-[0.68rem] tracking-wider px-2 py-0.5 border border-[#22C55E]/40 text-[#22C55E] bg-[#22C55E]/10">
                          PUBLISHED ({publishedCount} ITEMS)
                        </span>
                      ) : (
                        <span className="inline-block font-mono text-[0.68rem] tracking-wider px-2 py-0.5 border border-[#F5A623]/30 text-[#F5A623] bg-[#F5A623]/10">
                          PENDING LECTURER REVIEW
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {review.isPublished ? (
                        <Link
                          to="/student/feedback"
                          className="font-headline text-xs tracking-wider text-[#F5A623] hover:underline uppercase"
                        >
                          View Feedback →
                        </Link>
                      ) : (
                        <span className="font-mono text-xs text-[#6A6B78]">
                          Under Review
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  );
}
