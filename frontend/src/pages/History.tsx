// src/pages/History.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AureliaHeader } from '../components/AureliaHeader';
import { api } from '../services/api';
import type { Review } from '../types';

interface ArchiveItem {
  id: number;
  folioCode: string;
  title: string;
  author: string;
  date: string;
  formatScore: number;
  contentScore: number;
  innovationScore: number;
  overallScore: number;
  decision: string;
  status: string;
  hash: string;
}

export default function History() {
  const [reviews, setReviews] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDecision, setFilterDecision] = useState<'ALL' | 'AUTOMATIC' | 'LECTURER_REVIEW'>('ALL');

  useEffect(() => {
    loadArchive();
  }, []);

  const loadArchive = async () => {
    try {
      setLoading(true);
      const data = await api.getReviews();
      const mapped: ArchiveItem[] = (data || []).map((r: Review) => {
        const idNum = r.id;
        const dateStr = r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : 'PENDING';
        return {
          id: idNum,
          folioCode: `REV-2026-${String(idNum).padStart(3, '0')}`,
          title: r.title || 'Academic Manuscript Review',
          author: r.student_name || 'Candidate',
          date: dateStr,
          formatScore: Math.round(r.format_score ?? 85),
          contentScore: Math.round(r.content_score ?? 88),
          innovationScore: Math.round(r.innovation_score ?? 82),
          overallScore: Math.round(r.overall_score ?? 86),
          decision: (r.routing_decision || 'AUTOMATIC').toUpperCase(),
          status: r.status || 'COMPLETED',
          hash: `0x${((idNum * 1234567) % 0xFFFFFF).toString(16).padStart(6, '0')}...${((idNum * 9876543) % 0xFFFF).toString(16)}`
        };
      });
      setReviews(mapped);
    } catch (err: unknown) {
      console.warn('Could not load reviews archive:', err);
      setError('Could not connect to review archive ledger.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = reviews.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.folioCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDecision = filterDecision === 'ALL' || r.decision === filterDecision;
    return matchesSearch && matchesDecision;
  });

  return (
    <div className="min-h-screen bg-[#050508] text-[#E8E8EE] flex flex-col font-body">
      <AureliaHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pt-28 pb-16 space-y-8">
        <div className="border-b border-[rgba(245,166,35,0.18)] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="font-mono text-xs text-[#F5A623] tracking-[0.24em] uppercase block mb-1">
              Historical Repositories
            </span>
            <h1 className="font-headline text-3xl md:text-4xl font-light text-white tracking-wide">
              Archival Review Ledger
            </h1>
          </div>
          <div className="font-mono text-xs text-[#8A8B98] tracking-[0.16em] uppercase">
            Realtime Audit Trails · {reviews.length} Total Records
          </div>
        </div>

        {/* Search & Filter Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mounted-document-subtle p-4">
          <input
            type="text"
            placeholder="Search folio ID, manuscript title, or candidate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-80 bg-[#070814] border border-white/10 px-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#F5A623]"
          />

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-[#8A8B98]">Filter:</span>
            <select
              value={filterDecision}
              onChange={(e) => setFilterDecision(e.target.value as any)}
              className="bg-[#070814] border border-white/10 text-xs text-[#F5A623] px-3 py-1.5 focus:outline-none focus:border-[#F5A623]"
            >
              <option value="ALL">All Records ({reviews.length})</option>
              <option value="AUTOMATIC">Automatic Approval</option>
              <option value="LECTURER_REVIEW">Lecturer Audit</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-3 border border-red-500/30 bg-red-500/10 font-mono text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Ledger Table */}
        <div className="mounted-document p-0 overflow-hidden">
          <table className="w-full text-left border-collapse font-body">
            <thead>
              <tr className="border-b border-[rgba(245,166,35,0.18)] bg-[#070814] font-headline text-[0.68rem] tracking-[0.18em] uppercase text-[#7A7B8A]">
                <th className="py-3.5 px-4">Folio ID</th>
                <th className="py-3.5 px-4">Dissertation Title</th>
                <th className="py-3.5 px-4">Candidate</th>
                <th className="py-3.5 px-3">Date</th>
                <th className="py-3.5 px-3">Scores (F·C·I)</th>
                <th className="py-3.5 px-4">Decision</th>
                <th className="py-3.5 px-4">Audit Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs font-mono text-[#8A8B98]">
                    Loading real review ledger...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs font-mono text-[#8A8B98]">
                    No historical reviews found matching your filter.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-4 px-4 font-mono text-xs text-[#F5A623]">
                      {item.folioCode}
                    </td>
                    <td className="py-4 px-4">
                      <Link
                        to={`/reports/${item.id}`}
                        className="font-headline text-sm font-normal text-white group-hover:text-[#F5A623] transition-colors block"
                      >
                        {item.title}
                      </Link>
                      <span className="font-mono text-[0.68rem] text-[#6A6B78]">
                        Hash: {item.hash}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-[#A4A5B6]">
                      {item.author}
                      <div className="font-mono text-[0.68rem] text-[#6A6B78]">Cambridge CS & Tech</div>
                    </td>
                    <td className="py-4 px-3 font-mono text-xs text-[#7A7B8A]">
                      {item.date}
                    </td>
                    <td className="py-4 px-3 font-mono text-xs">
                      <span className="text-white">{item.formatScore}</span>
                      <span className="text-[#6A6B78]"> · </span>
                      <span className="text-[#F5A623]">{item.contentScore}</span>
                      <span className="text-[#6A6B78]"> · </span>
                      <span className="text-[#7B6CFF]">{item.innovationScore}</span>
                    </td>
                    <td className="py-4 px-4">
                      {item.decision === 'AUTOMATIC' ? (
                        <span className="inline-block font-mono text-[0.68rem] tracking-wider px-2 py-0.5 border border-[#F5A623]/30 text-[#F5A623] bg-[#F5A623]/10">
                          AUTOMATIC
                        </span>
                      ) : (
                        <span className="inline-block font-mono text-[0.68rem] tracking-wider px-2 py-0.5 border border-[#C45C4A]/40 text-[#C45C4A] bg-[#C45C4A]/10">
                          LECTURER AUDIT
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 space-x-2">
                      <Link
                        to={`/reports/${item.id}`}
                        className="font-headline text-[0.7rem] tracking-[0.14em] uppercase text-[#F5A623] hover:underline"
                      >
                        Inspect Report →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
