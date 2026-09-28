// src/pages/History.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AureliaHeader } from '../components/AureliaHeader';

interface ArchiveEntry {
  id: string;
  title: string;
  author: string;
  department: string;
  date: string;
  formatScore: number;
  contentScore: number;
  innovationScore: number;
  decision: 'AUTOMATIC' | 'LECTURER_REVIEW';
  hash: string;
}

const ARCHIVE_RECORDS: ArchiveEntry[] = [
  {
    id: 'REV-2026-081',
    title: 'Smart Storage Monitoring System using IoT and Machine Learning',
    author: 'Alex Rivera',
    department: 'Computer Science',
    date: '18 SEP 2026',
    formatScore: 94,
    contentScore: 89,
    innovationScore: 91,
    decision: 'AUTOMATIC',
    hash: '0x8f2a...39d1',
  },
  {
    id: 'REV-2026-079',
    title: 'Adaptive Traffic Signal Optimization using Deep Reinforcement Learning',
    author: 'Priya Sharma',
    department: 'Artificial Intelligence',
    date: '17 SEP 2026',
    formatScore: 78,
    contentScore: 84,
    innovationScore: 88,
    decision: 'LECTURER_REVIEW',
    hash: '0x7c14...e29b',
  },
  {
    id: 'REV-2026-075',
    title: 'Microgrid Energy Trading on Distributed Ledgers',
    author: 'Liam Vance',
    department: 'Electrical Engineering',
    date: '15 SEP 2026',
    formatScore: 92,
    contentScore: 95,
    innovationScore: 86,
    decision: 'AUTOMATIC',
    hash: '0x3e88...a941',
  },
  {
    id: 'REV-2026-071',
    title: 'Zero-Knowledge Proofs in Decentralized Healthcare Record Systems',
    author: 'Elena Rostova',
    department: 'Computer Science',
    date: '12 SEP 2026',
    formatScore: 96,
    contentScore: 92,
    innovationScore: 95,
    decision: 'AUTOMATIC',
    hash: '0x992d...41fc',
  },
  {
    id: 'REV-2026-068',
    title: 'Autonomous Drone Swarm Navigation in GPS-Denied Environments',
    author: 'Marcus Brody',
    department: 'Robotics',
    date: '08 SEP 2026',
    formatScore: 81,
    contentScore: 88,
    innovationScore: 82,
    decision: 'LECTURER_REVIEW',
    hash: '0x55bb...1200',
  },
];

export default function History() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDecision, setFilterDecision] = useState<'ALL' | 'AUTOMATIC' | 'LECTURER_REVIEW'>('ALL');

  const filtered = ARCHIVE_RECORDS.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase());
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
            Encrypted Audit Trails · 5 Immutable Records
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
              <option value="ALL">All Decisions ({ARCHIVE_RECORDS.length})</option>
              <option value="AUTOMATIC">Automatic Approval</option>
              <option value="LECTURER_REVIEW">Lecturer Audit</option>
            </select>
          </div>
        </div>

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
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="py-4 px-4 font-mono text-xs text-[#F5A623]">
                    {item.id}
                  </td>
                  <td className="py-4 px-4">
                    <Link
                      to="/reviews/1"
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
                    <div className="font-mono text-[0.68rem] text-[#6A6B78]">{item.department}</div>
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
                  <td className="py-4 px-4">
                    <Link
                      to="/reviews/1"
                      className="font-headline text-[0.7rem] tracking-[0.14em] uppercase text-[#F5A623] hover:underline"
                    >
                      Inspect Folio →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
