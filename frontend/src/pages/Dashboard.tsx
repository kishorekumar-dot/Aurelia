// src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AureliaHeader } from '../components/AureliaHeader';
import { getActiveReview, type ReviewState } from '../utils/storage';

interface SubmissionsRecord {
  id: string;
  student: string;
  studentEmail: string;
  project: string;
  department: string;
  version: number;
  date: string;
  reviewStatus: 'SUBMITTED' | 'ANALYZING' | 'LECTURER_REVIEW' | 'PUBLISHED' | 'REVISION_REQUESTED';
  findingsCount: number;
  isPublished: boolean;
  routing: 'AUTOMATIC' | 'LECTURER_REVIEW';
  scores: {
    format: number;
    content: number;
    innovation: number;
  };
}

export default function Dashboard() {
  const [activeReview] = useState<ReviewState>(getActiveReview());
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'NEEDS_REVIEW' | 'PUBLISHED' | 'RESUBMISSION'>('ALL');
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDept, setNewGroupDept] = useState('Computer Science & Technology');
  const [groupCreatedNotice, setGroupCreatedNotice] = useState<string | null>(null);

  // Dynamic submissions list linking with storage
  const [submissions, setSubmissions] = useState<SubmissionsRecord[]>([
    {
      id: 'REV-2026-081',
      student: activeReview.author,
      studentEmail: activeReview.studentEmail,
      project: activeReview.title,
      department: activeReview.department,
      version: activeReview.version,
      date: activeReview.submissionDate,
      reviewStatus: activeReview.status,
      findingsCount: activeReview.findings.length,
      isPublished: activeReview.isPublished,
      routing: activeReview.routingDecision,
      scores: {
        format: activeReview.formatScore,
        content: activeReview.contentScore,
        innovation: activeReview.innovationScore
      }
    },
    {
      id: 'REV-2026-079',
      student: 'Priya Sharma',
      studentEmail: 'priya.sharma@student.cambridge.edu',
      project: 'Adaptive Traffic Signal Optimization using Deep Reinforcement Learning',
      department: 'Artificial Intelligence',
      version: 2,
      date: '17 SEP 2026',
      reviewStatus: 'LECTURER_REVIEW',
      findingsCount: 4,
      isPublished: false,
      routing: 'LECTURER_REVIEW',
      scores: { format: 78, content: 84, innovation: 88 }
    },
    {
      id: 'REV-2026-075',
      student: 'Liam Vance',
      studentEmail: 'liam.vance@student.cambridge.edu',
      project: 'Microgrid Energy Trading on Distributed Ledgers',
      department: 'Electrical Engineering',
      version: 1,
      date: '15 SEP 2026',
      reviewStatus: 'PUBLISHED',
      findingsCount: 3,
      isPublished: true,
      routing: 'AUTOMATIC',
      scores: { format: 92, content: 95, innovation: 86 }
    },
    {
      id: 'REV-2026-071',
      student: 'Elena Rostova',
      studentEmail: 'elena.rostova@student.cambridge.edu',
      project: 'Zero-Knowledge Proofs in Decentralized Healthcare Records',
      department: 'Computer Science',
      version: 1,
      date: '12 SEP 2026',
      reviewStatus: 'PUBLISHED',
      findingsCount: 5,
      isPublished: true,
      routing: 'AUTOMATIC',
      scores: { format: 96, content: 92, innovation: 95 }
    },
    {
      id: 'REV-2026-068',
      student: 'Marcus Brody',
      studentEmail: 'marcus.brody@student.cambridge.edu',
      project: 'Autonomous Drone Swarm Navigation in GPS-Denied Environments',
      department: 'Robotics',
      version: 3,
      date: '08 SEP 2026',
      reviewStatus: 'REVISION_REQUESTED',
      findingsCount: 6,
      isPublished: false,
      routing: 'LECTURER_REVIEW',
      scores: { format: 81, content: 88, innovation: 82 }
    }
  ]);

  useEffect(() => {
    const current = getActiveReview();
    setSubmissions(prev => prev.map(s => {
      if (s.id === 'REV-2026-081') {
        return {
          ...s,
          version: current.version,
          isPublished: current.isPublished,
          reviewStatus: current.status,
          date: current.submissionDate
        };
      }
      return s;
    }));
  }, []);

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setGroupCreatedNotice(`Project review group "${newGroupName}" established with ${newGroupDept} guidelines.`);
    setNewGroupName('');
    setTimeout(() => {
      setGroupCreatedNotice(null);
      setIsGroupModalOpen(false);
    }, 2000);
  };

  const filtered = submissions.filter((r) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'NEEDS_REVIEW') return r.routing === 'LECTURER_REVIEW' || !r.isPublished;
    if (selectedFilter === 'PUBLISHED') return r.isPublished;
    if (selectedFilter === 'RESUBMISSION') return r.version > 1;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#050508] text-[#E8E8EE] flex flex-col font-body">
      <AureliaHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pt-28 pb-16 space-y-10">
        
        {/* Header Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[rgba(245,166,35,0.18)] pb-6">
          <div>
            <span className="font-mono text-xs text-[#F5A623] tracking-[0.24em] uppercase block mb-1">
              Faculty Supervision Terminal · Dr. Evelyn Chen
            </span>
            <h1 className="font-headline text-3xl md:text-4xl font-light text-white tracking-wide">
              Academic Review Desk
            </h1>
            <p className="text-xs font-mono text-[#8A8B98] mt-1">
              Active Scope: Computer Science & Engineering Capstones 2026
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsGroupModalOpen(true)}
              className="px-4 py-2.5 border border-white/15 text-xs font-headline tracking-[0.16em] uppercase text-[#9A9BA8] hover:text-white hover:border-[#F5A623] transition-colors cursor-pointer"
            >
              + Create Review Group (FR-02)
            </button>
            <Link
              to="/reviews/new"
              className="btn-terracotta px-5 py-2.5 text-xs font-headline tracking-[0.16em] uppercase shadow-lg"
            >
              + Ingest Manuscript
            </Link>
          </div>
        </div>

        {/* PRD Section 12: 6 Required Dashboard Metrics */}
        {/* Total Students, Pending Reviews, Reviews In Progress, Needs Lecturer Review, Published Feedback, Resubmissions */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pb-2">
          
          <div className="mounted-document p-4 space-y-1">
            <span className="font-headline text-[0.62rem] tracking-[0.18em] text-[#8A8B98] uppercase block">
              Total Students
            </span>
            <div className="font-headline text-3xl font-light text-white">
              24
            </div>
            <span className="font-mono text-[0.62rem] text-[#6A6B78] block">Assigned M.Sc candidates</span>
          </div>

          <div className="mounted-document p-4 space-y-1">
            <span className="font-headline text-[0.62rem] tracking-[0.18em] text-[#8A8B98] uppercase block">
              Pending Reviews
            </span>
            <div className="font-headline text-3xl font-light text-[#F5A623]">
              04
            </div>
            <span className="font-mono text-[0.62rem] text-[#6A6B78] block">Awaiting initial checks</span>
          </div>

          <div className="mounted-document p-4 space-y-1">
            <span className="font-headline text-[0.62rem] tracking-[0.18em] text-[#8A8B98] uppercase block">
              In Progress
            </span>
            <div className="font-headline text-3xl font-light text-[#7B6CFF]">
              02
            </div>
            <span className="font-mono text-[0.62rem] text-[#6A6B78] block">Multi-agent pipeline</span>
          </div>

          <div className="mounted-document p-4 space-y-1">
            <span className="font-headline text-[0.62rem] tracking-[0.18em] text-[#8A8B98] uppercase block">
              Needs Lecturer Review
            </span>
            <div className="font-headline text-3xl font-light text-[#C45C4A]">
              03
            </div>
            <span className="font-mono text-[0.62rem] text-[#6A6B78] block">Level 1 academic audit</span>
          </div>

          <div className="mounted-document p-4 space-y-1">
            <span className="font-headline text-[0.62rem] tracking-[0.18em] text-[#8A8B98] uppercase block">
              Published Feedback
            </span>
            <div className="font-headline text-3xl font-light text-[#22C55E]">
              15
            </div>
            <span className="font-mono text-[0.62rem] text-[#6A6B78] block">Released to student desk</span>
          </div>

          <div className="mounted-document p-4 space-y-1">
            <span className="font-headline text-[0.62rem] tracking-[0.18em] text-[#8A8B98] uppercase block">
              Resubmissions
            </span>
            <div className="font-headline text-3xl font-light text-[#6EC8FF]">
              03
            </div>
            <span className="font-mono text-[0.62rem] text-[#6A6B78] block">Version 2+ revisions</span>
          </div>

        </div>

        {/* 3-Column Layout: Left Spine + Center Submissions Ledger + Right Live Policy Snapshot */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Spine Navigation */}
          <aside className="lg:col-span-2 space-y-6">
            <div className="font-headline text-[0.7rem] text-[#6A6B78] tracking-[0.22em] uppercase">
              // Queue Filters
            </div>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedFilter('ALL')}
                className={`w-full text-left font-headline text-xs tracking-[0.16em] uppercase py-2.5 px-3 border-l-2 transition-colors ${
                  selectedFilter === 'ALL'
                    ? 'border-[#F5A623] text-white bg-white/[0.02]'
                    : 'border-transparent text-[#8A8B98] hover:text-white'
                }`}
              >
                All Submissions ({submissions.length})
              </button>
              <button
                onClick={() => setSelectedFilter('NEEDS_REVIEW')}
                className={`w-full text-left font-headline text-xs tracking-[0.16em] uppercase py-2.5 px-3 border-l-2 transition-colors ${
                  selectedFilter === 'NEEDS_REVIEW'
                    ? 'border-[#C45C4A] text-[#C45C4A] bg-white/[0.02]'
                    : 'border-transparent text-[#8A8B98] hover:text-white'
                }`}
              >
                Needs Review (2)
              </button>
              <button
                onClick={() => setSelectedFilter('PUBLISHED')}
                className={`w-full text-left font-headline text-xs tracking-[0.16em] uppercase py-2.5 px-3 border-l-2 transition-colors ${
                  selectedFilter === 'PUBLISHED'
                    ? 'border-[#22C55E] text-[#22C55E] bg-white/[0.02]'
                    : 'border-transparent text-[#8A8B98] hover:text-white'
                }`}
              >
                Published (2)
              </button>
              <button
                onClick={() => setSelectedFilter('RESUBMISSION')}
                className={`w-full text-left font-headline text-xs tracking-[0.16em] uppercase py-2.5 px-3 border-l-2 transition-colors ${
                  selectedFilter === 'RESUBMISSION'
                    ? 'border-[#6EC8FF] text-[#6EC8FF] bg-white/[0.02]'
                    : 'border-transparent text-[#8A8B98] hover:text-white'
                }`}
              >
                Resubmissions (2)
              </button>
            </div>

            <div className="pt-6 border-t border-white/[0.06] space-y-3">
              <span className="font-mono text-[0.65rem] text-[#6A6B78] uppercase tracking-wider block">
                Workflow Short-Cut:
              </span>
              <Link
                to="/student"
                className="block text-center py-2 px-3 border border-white/10 hover:border-[#7B6CFF] text-[0.68rem] font-mono text-[#7B6CFF] transition-colors"
              >
                ⇄ View Student Portal →
              </Link>
            </div>
          </aside>

          {/* Center: Recent Submissions Ledger (PRD Section 12) */}
          {/* Columns: student, project, submission version, date, review status, findings count, published status */}
          <section className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between pb-1">
              <span className="font-headline text-xs tracking-[0.2em] uppercase text-[#8A8B98]">
                Recent Submissions Ledger (PRD Section 12)
              </span>
              <span className="font-mono text-xs text-[#6A6B78]">
                Showing {filtered.length} candidate reports
              </span>
            </div>

            <div className="mounted-document p-0 overflow-hidden">
              <table className="w-full text-left border-collapse font-body">
                <thead>
                  <tr className="border-b border-[rgba(245,166,35,0.18)] bg-[#070814] font-headline text-[0.65rem] tracking-[0.18em] uppercase text-[#7A7B8A]">
                    <th className="py-3 px-3">Student Candidate</th>
                    <th className="py-3 px-3">Project & Version</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-2">Review Status</th>
                    <th className="py-3 px-2">Findings</th>
                    <th className="py-3 px-3">Published Status</th>
                    <th className="py-3 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                      {/* 1. Student */}
                      <td className="py-4 px-3 text-xs text-white">
                        <div className="font-headline font-normal">{item.student}</div>
                        <span className="font-mono text-[0.65rem] text-[#6A6B78]">{item.department}</span>
                      </td>

                      {/* 2. Project & Version */}
                      <td className="py-4 px-3">
                        <Link
                          to="/reviews/1"
                          className="font-headline text-xs text-white group-hover:text-[#F5A623] transition-colors block line-clamp-1"
                        >
                          {item.project}
                        </Link>
                        <span className="font-mono text-[0.68rem] text-[#F5A623]">
                          Version {item.version}.0
                        </span>
                      </td>

                      {/* 3. Date */}
                      <td className="py-4 px-3 font-mono text-[0.7rem] text-[#7A7B8A] whitespace-nowrap">
                        {item.date}
                      </td>

                      {/* 4. Review Status */}
                      <td className="py-4 px-2">
                        <span className={`inline-block font-mono text-[0.62rem] tracking-wider px-2 py-0.5 border ${
                          item.routing === 'AUTOMATIC'
                            ? 'border-[#F5A623]/30 text-[#F5A623] bg-[#F5A623]/10'
                            : 'border-[#C45C4A]/40 text-[#C45C4A] bg-[#C45C4A]/10'
                        } uppercase whitespace-nowrap`}>
                          {item.routing === 'AUTOMATIC' ? 'AUTO AUDIT' : 'LECTURER AUDIT'}
                        </span>
                      </td>

                      {/* 5. Findings Count */}
                      <td className="py-4 px-2 font-mono text-xs text-[#A4A5B6]">
                        {item.findingsCount} items
                      </td>

                      {/* 6. Published Status (PRD Principle 3.2) */}
                      <td className="py-4 px-3">
                        {item.isPublished ? (
                          <span className="inline-block font-mono text-[0.62rem] px-2 py-0.5 border border-[#22C55E]/40 text-[#22C55E] bg-[#22C55E]/10 uppercase whitespace-nowrap">
                            ✓ PUBLISHED
                          </span>
                        ) : (
                          <span className="inline-block font-mono text-[0.62rem] px-2 py-0.5 border border-[#F5A623]/30 text-[#F5A623] bg-[#F5A623]/10 uppercase whitespace-nowrap">
                            UNPUBLISHED
                          </span>
                        )}
                      </td>

                      {/* 7. Action */}
                      <td className="py-4 px-3">
                        <Link
                          to="/reviews/1"
                          className="font-headline text-[0.68rem] tracking-wider uppercase text-[#F5A623] hover:underline whitespace-nowrap"
                        >
                          Inspect →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Right: Live Policy Snapshot & Active Review Groups */}
          <aside className="lg:col-span-3 space-y-6">
            
            {/* Live Policy Snapshot */}
            <div className="space-y-3">
              <div className="font-headline text-xs tracking-[0.2em] uppercase text-[#8A8B98]">
                Live Policy Snapshot
              </div>

              <div className="mounted-document-subtle p-5 space-y-4 font-mono text-xs">
                <div className="border-b border-white/[0.06] pb-3">
                  <div className="text-[#F5A623] text-[0.68rem] tracking-widest uppercase">
                    ACTIVE RULESET
                  </div>
                  <div className="text-white font-headline text-sm font-normal mt-0.5">
                    Dept CS Postgrad v4.2
                  </div>
                </div>

                <div className="space-y-2 text-[#9A9BA8] text-[0.72rem]">
                  <div className="flex justify-between">
                    <span>Figure Caption Mandatory</span>
                    <span className="text-[#F5A623]">ENFORCED</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Min Peer Citations</span>
                    <span className="text-white">&gt; 12</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dataset DOI Verification</span>
                    <span className="text-[#7B6CFF]">ACTIVE</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Evidence Contradiction Audit</span>
                    <span className="text-[#22C55E]">STRICT</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.06]">
                  <Link
                    to="/rules"
                    className="font-headline text-[0.72rem] tracking-[0.16em] uppercase text-[#F5A623] hover:underline block text-center"
                  >
                    Adjust Rules Engine →
                  </Link>
                </div>
              </div>
            </div>

            {/* Active Review Groups (FR-02) */}
            <div className="space-y-3">
              <div className="font-headline text-xs tracking-[0.2em] uppercase text-[#8A8B98]">
                Review Groups (PRD FR-02)
              </div>

              <div className="mounted-document-subtle p-5 space-y-3 font-mono text-xs">
                <div className="space-y-1 border-b border-white/[0.06] pb-2.5">
                  <div className="text-white font-headline text-xs font-normal">
                    M.Sc Intelligent Systems 2026
                  </div>
                  <div className="text-[0.68rem] text-[#6A6B78]">
                    12 Assigned Students · CS Department
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-white font-headline text-xs font-normal">
                    Distributed Systems & IoT Capstones
                  </div>
                  <div className="text-[0.68rem] text-[#6A6B78]">
                    8 Assigned Students · Engineering
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setIsGroupModalOpen(true)}
                    className="text-[0.68rem] font-mono text-[#F5A623] hover:underline"
                  >
                    + Assign New Students
                  </button>
                </div>
              </div>
            </div>

          </aside>

        </div>

        {/* Modal: Create Review Group (PRD FR-02) */}
        {isGroupModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md mounted-document p-8 space-y-6 border border-[rgba(245,166,35,0.4)] animate-in fade-in zoom-in-95">
              <div className="border-b border-white/[0.06] pb-3">
                <span className="font-mono text-[0.65rem] text-[#F5A623] tracking-widest uppercase block">
                  PRD FR-02 · GROUP MANAGEMENT
                </span>
                <h3 className="font-headline text-2xl font-light text-white mt-1">
                  Create Review Group
                </h3>
              </div>

              {groupCreatedNotice ? (
                <div className="p-4 bg-[#22C55E]/10 border border-[#22C55E]/40 font-mono text-xs text-[#22C55E]">
                  ✓ {groupCreatedNotice}
                </div>
              ) : (
                <form onSubmit={handleCreateGroup} className="space-y-4 font-mono text-xs">
                  <div>
                    <label className="block text-[#8A8B98] uppercase tracking-wider mb-1">
                      Group / Cohort Name:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. M.Sc AI Capstone Cohort 2026"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="w-full bg-[#080914] border border-white/15 px-3 py-2 text-white focus:outline-none focus:border-[#F5A623]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#8A8B98] uppercase tracking-wider mb-1">
                      Academic Department:
                    </label>
                    <select
                      value={newGroupDept}
                      onChange={(e) => setNewGroupDept(e.target.value)}
                      className="w-full bg-[#080914] border border-white/15 px-3 py-2 text-white focus:outline-none focus:border-[#F5A623]"
                    >
                      <option value="Computer Science & Technology">Computer Science & Technology</option>
                      <option value="Artificial Intelligence">Artificial Intelligence</option>
                      <option value="Electrical Engineering">Electrical Engineering</option>
                      <option value="Robotics & Autonomous Systems">Robotics & Autonomous Systems</option>
                    </select>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsGroupModalOpen(false)}
                      className="px-4 py-2 border border-white/15 text-xs text-[#8A8B98] hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-terracotta px-5 py-2 text-xs font-headline uppercase tracking-wider cursor-pointer"
                    >
                      Establish Group
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
