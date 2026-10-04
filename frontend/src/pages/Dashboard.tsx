// src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AureliaHeader } from '../components/AureliaHeader';
import { api } from '../services/api';

interface Review {
  id: number;
  title: string;
  student_name: string;
  status: string;
  created_at: string;
  overall_score?: number;
  format_score?: number;
  content_score?: number;
  innovation_score?: number;
  routing_decision?: string;
  findings_count?: number;
  is_published?: boolean;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'NEEDS_REVIEW' | 'PUBLISHED' | 'IN_PROGRESS'>('ALL');
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDept, setNewGroupDept] = useState('Computer Science & Technology');
  const [groupCreatedNotice, setGroupCreatedNotice] = useState<string | null>(null);

  const authData = (() => {
    try { return JSON.parse(localStorage.getItem('aurelia_auth') || '{}'); }
    catch { return {}; }
  })();



  useEffect(() => {
    api.getReviews()
      .then(data => setReviews(data as unknown as Review[]))
      .catch(console.error)
      .finally(() => setLoading(false));
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

  const filtered = reviews.filter((r) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'NEEDS_REVIEW') return r.routing_decision === 'LECTURER' && !r.is_published;
    if (selectedFilter === 'PUBLISHED') return r.is_published || r.status === 'PUBLISHED';
    if (selectedFilter === 'IN_PROGRESS') return r.status === 'RUNNING' || r.status === 'PENDING' || r.status === 'SUBMITTED';
    return true;
  });

  const totalStudents = reviews.length;
  const pendingCount = reviews.filter(r => !r.is_published && r.status !== 'RUNNING').length;
  const runningCount = reviews.filter(r => r.status === 'RUNNING' || r.status === 'PENDING' || r.status === 'SUBMITTED').length;
  const needsReviewCount = reviews.filter(r => r.routing_decision === 'LECTURER' && !r.is_published).length;
  const publishedCount = reviews.filter(r => r.is_published || r.status === 'PUBLISHED').length;
  const completedCount = reviews.filter(r => r.status === 'COMPLETED').length;


  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center font-mono text-[#F5A623]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin mx-auto" />
          Loading review desk...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] text-[#E8E8EE] flex flex-col font-body">
      <AureliaHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pt-28 pb-16 space-y-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[rgba(245,166,35,0.18)] pb-6">
          <div>
            <span className="font-mono text-xs text-[#F5A623] tracking-[0.24em] uppercase block mb-1">
              Faculty Supervision Terminal · {authData.name || 'Lecturer'}
            </span>
            <h1 className="font-headline text-3xl md:text-4xl font-light text-white tracking-wide">
              Academic Review Desk
            </h1>
            <p className="text-xs font-mono text-[#8A8B98] mt-1">
              {authData.department ? `${authData.department} Capstones` : 'All Capstones'}
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

        {/* Dashboard Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pb-2">
          {[
            { label: 'Total Reviews', val: totalStudents, color: 'text-white', sub: 'Submitted manuscripts' },
            { label: 'Pending', val: pendingCount, color: 'text-[#F5A623]', sub: 'Awaiting analysis' },
            { label: 'In Progress', val: runningCount, color: 'text-[#7B6CFF]', sub: 'Multi-agent pipeline' },
            { label: 'Needs Review', val: needsReviewCount, color: 'text-[#C45C4A]', sub: 'Lecturer audit required' },
            { label: 'Published', val: publishedCount, color: 'text-[#22C55E]', sub: 'Released to student' },
            { label: 'Completed', val: completedCount, color: 'text-[#6EC8FF]', sub: 'Pipeline finished' },
          ].map(({ label, val, color, sub }) => (
            <div key={label} className="mounted-document p-4 space-y-1">
              <span className="font-headline text-[0.62rem] tracking-[0.18em] text-[#8A8B98] uppercase block">{label}</span>
              <div className={`font-headline text-3xl font-light ${color}`}>{String(val).padStart(2, '0')}</div>
              <span className="font-mono text-[0.62rem] text-[#6A6B78] block">{sub}</span>
            </div>
          ))}
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
                All Reviews ({reviews.length})
              </button>
              <button
                onClick={() => setSelectedFilter('NEEDS_REVIEW')}
                className={`w-full text-left font-headline text-xs tracking-[0.16em] uppercase py-2.5 px-3 border-l-2 transition-colors ${
                  selectedFilter === 'NEEDS_REVIEW'
                    ? 'border-[#C45C4A] text-[#C45C4A] bg-white/[0.02]'
                    : 'border-transparent text-[#8A8B98] hover:text-white'
                }`}
              >
                Needs Review ({needsReviewCount})
              </button>
              <button
                onClick={() => setSelectedFilter('PUBLISHED')}
                className={`w-full text-left font-headline text-xs tracking-[0.16em] uppercase py-2.5 px-3 border-l-2 transition-colors ${
                  selectedFilter === 'PUBLISHED'
                    ? 'border-[#22C55E] text-[#22C55E] bg-white/[0.02]'
                    : 'border-transparent text-[#8A8B98] hover:text-white'
                }`}
              >
                Published ({publishedCount})
              </button>
              <button
                onClick={() => setSelectedFilter('IN_PROGRESS')}
                className={`w-full text-left font-headline text-xs tracking-[0.16em] uppercase py-2.5 px-3 border-l-2 transition-colors ${
                  selectedFilter === 'IN_PROGRESS'
                    ? 'border-[#6EC8FF] text-[#6EC8FF] bg-white/[0.02]'
                    : 'border-transparent text-[#8A8B98] hover:text-white'
                }`}
              >
                In Progress ({runningCount})
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
                    <th className="py-3 px-3">Student</th>
                    <th className="py-3 px-3">Project</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Score</th>
                    <th className="py-3 px-3">Published</th>
                    <th className="py-3 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="py-12 text-center font-mono text-xs text-[#8A8B98]">
                      No reviews found. Upload a manuscript to get started.
                    </td></tr>
                  )}
                  {filtered.map((item) => {
                    const statusColor = item.status === 'COMPLETED' ? 'border-[#22C55E]/40 text-[#22C55E] bg-[#22C55E]/10'
                      : item.status === 'RUNNING' ? 'border-[#7B6CFF]/40 text-[#7B6CFF] bg-[#7B6CFF]/10'
                      : item.status === 'FAILED' ? 'border-[#EF4444]/40 text-[#EF4444] bg-[#EF4444]/10'
                      : 'border-[#F5A623]/30 text-[#F5A623] bg-[#F5A623]/10';
                    const reviewLink = item.status === 'COMPLETED' || item.status === 'PUBLISHED'
                      ? `/reviews/${item.id}` : `/reviews/${item.id}/live`;
                    return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => navigate(reviewLink)}>
                      <td className="py-4 px-3 text-xs text-white">
                        <div className="font-headline font-normal">{item.student_name}</div>
                      </td>

                      <td className="py-4 px-3">
                        <span className="font-headline text-xs text-white group-hover:text-[#F5A623] transition-colors block line-clamp-1">
                          {item.title}
                        </span>
                      </td>

                      <td className="py-4 px-3 font-mono text-[0.7rem] text-[#7A7B8A] whitespace-nowrap">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : '—'}
                      </td>

                      <td className="py-4 px-2">
                        <span className={`inline-block font-mono text-[0.62rem] tracking-wider px-2 py-0.5 border ${statusColor} uppercase whitespace-nowrap`}>
                          {item.status}
                        </span>
                      </td>

                      <td className="py-4 px-2 font-mono text-xs text-[#A4A5B6]">
                        {item.overall_score != null ? `${Math.round(item.overall_score)}%` : '—'}
                      </td>

                      <td className="py-4 px-3">
                        {item.is_published || item.status === 'PUBLISHED' ? (
                          <span className="inline-block font-mono text-[0.62rem] px-2 py-0.5 border border-[#22C55E]/40 text-[#22C55E] bg-[#22C55E]/10 uppercase whitespace-nowrap">
                            ✓ PUBLISHED
                          </span>
                        ) : (
                          <span className="inline-block font-mono text-[0.62rem] px-2 py-0.5 border border-[#F5A623]/30 text-[#F5A623] bg-[#F5A623]/10 uppercase whitespace-nowrap">
                            {item.status === 'RUNNING' ? 'ANALYZING' : 'UNPUBLISHED'}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-3">
                        <Link
                          to={reviewLink}
                          className="font-headline text-[0.68rem] tracking-wider uppercase text-[#F5A623] hover:underline whitespace-nowrap"
                        >
                          {item.status === 'COMPLETED' ? 'Inspect →' : item.status === 'RUNNING' ? 'Monitor →' : 'View →'}
                        </Link>
                      </td>
                    </tr>
                    );
                  })}
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
