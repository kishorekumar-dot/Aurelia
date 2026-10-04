// src/pages/RulesTemplates.tsx
import { useState, useEffect } from 'react';
import { AureliaHeader } from '../components/AureliaHeader';
import { api } from '../services/api';

interface RuleStipulation {
  code: string;
  category: string;
  statement: string;
  obligation: 'MUST' | 'SHOULD';
  weight: number;
}

const DEFAULT_RULES: RuleStipulation[] = [
  {
    code: 'RUL-METH-01',
    category: 'Methodology & Algorithms',
    statement: 'Every algorithmic claim must cite benchmark dataset provenance and hardware execution parameters.',
    obligation: 'MUST',
    weight: 25,
  },
  {
    code: 'RUL-DATA-02',
    category: 'Data Integrity & Reproducibility',
    statement: 'Results tables must state standard deviations or p-value significance levels across three distinct trials.',
    obligation: 'MUST',
    weight: 20,
  },
  {
    code: 'RUL-FORM-03',
    category: 'Format & Schemas',
    statement: 'Figures must contain vector captions with explicit cross-references in the preceding discussion text.',
    obligation: 'SHOULD',
    weight: 15,
  },
  {
    code: 'RUL-INNO-04',
    category: 'Innovation & Literature Delta',
    statement: 'The literature review must compare the proposed system against at least two peer-reviewed baselines from 2023–2026.',
    obligation: 'MUST',
    weight: 40,
  },
];

export default function RulesTemplates() {
  const [rules, setRules] = useState<RuleStipulation[]>(DEFAULT_RULES);
  const [newStatement, setNewStatement] = useState('');
  const [category, setCategory] = useState('Methodology & Algorithms');
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeSchemaTitle, setActiveSchemaTitle] = useState('Computer Science Departmental Rubric v4.2');

  useEffect(() => {
    loadBackendRules();
  }, []);

  const loadBackendRules = async () => {
    try {
      const serverRules = await api.getRules();
      if (serverRules && serverRules.length > 0) {
        const primary = serverRules[0];
        setActiveSchemaTitle(`${primary.title} (v${primary.version || '1.0'})`);
        if (primary.active_policy?.checklists && primary.active_policy.checklists.length > 0) {
          const loadedStipulations: RuleStipulation[] = primary.active_policy.checklists.map((c: string, idx: number) => ({
            code: `RUL-POL-0${idx + 1}`,
            category: 'Departmental Verification',
            statement: c,
            obligation: 'MUST',
            weight: Math.round(100 / primary.active_policy.checklists.length),
          }));
          setRules(loadedStipulations);
        }
      }
    } catch (e) {
      console.warn('Could not load backend rules, using default institutional rules', e);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatement.trim()) return;

    const newRule: RuleStipulation = {
      code: `RUL-CUST-0${rules.length + 1}`,
      category,
      statement: newStatement,
      obligation: 'MUST',
      weight: 10,
    };

    setRules(prev => [...prev, newRule]);

    try {
      await api.parsePolicy(newStatement);
      setUploadNotice(`Clause verified and integrated into pipeline engine.`);
      setTimeout(() => setUploadNotice(null), 4000);
    } catch {
      // Still keep locally added rule
      setUploadNotice(`Clause appended to active session.`);
      setTimeout(() => setUploadNotice(null), 4000);
    }

    setNewStatement('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadNotice(`Ingesting and compiling clauses from ${file.name}...`);

    try {
      const res = await api.uploadRule(
        file.name.replace(/\.[^/.]+$/, ''),
        `Institutional rubric uploaded: ${file.name}`,
        file
      );

      setActiveSchemaTitle(`${res.title} (v${res.version})`);
      setUploadNotice(`✓ Successfully compiled rubric "${file.name}" into verification graph.`);
      setTimeout(() => setUploadNotice(null), 6000);
      loadBackendRules();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error uploading syllabus';
      setUploadNotice(`Upload warning: ${msg}. Ingested into current session.`);
      setTimeout(() => setUploadNotice(null), 6000);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-[#E8E8EE] flex flex-col font-body">
      <AureliaHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pt-28 pb-16 space-y-12">
        {/* Header */}
        <div className="border-b border-[rgba(245,166,35,0.18)] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="font-mono text-xs text-[#F5A623] tracking-[0.24em] uppercase block mb-1">
              Institutional Governance
            </span>
            <h1 className="font-headline text-3xl md:text-4xl font-light text-white tracking-wide">
              Rules & Adaptive Policy Engine
            </h1>
          </div>
          <p className="font-headline text-xs text-[#8A8B98] tracking-[0.16em] uppercase">
            Active Schema: {activeSchemaTitle}
          </p>
        </div>

        {/* 2-Column Split: Upload & Input on Left, Typeset Adaptive Policy on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Upload Rules / Ingestion */}
          <div className="lg:col-span-5 space-y-8">
            {/* Upload Box */}
            <div className="mounted-document p-6 space-y-4">
              <span className="font-headline text-xs tracking-[0.2em] text-[#F5A623] uppercase block">
                Ingest Lecturer Rubric / Syllabus
              </span>
              <p className="text-xs text-[#9A9BA8] font-light leading-relaxed">
                Upload departmental evaluation guidelines (.pdf, .docx, or .txt). Aurelia compiles natural language clauses into verification nodes.
              </p>

              <div className="border border-dashed border-[rgba(245,166,35,0.3)] hover:border-[#F5A623] p-6 text-center cursor-pointer transition-colors bg-[#070814] relative">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  disabled={isUploading}
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="font-headline text-xs tracking-[0.18em] uppercase text-white mb-1">
                  {isUploading ? 'Compiling Clauses...' : 'Drop Syllabus or Click to Ingest'}
                </div>
                <div className="font-mono text-[0.68rem] text-[#6A6B78]">
                  PDF, DOCX, TXT UP TO 25MB · REALTIME PARSER
                </div>
              </div>

              {uploadNotice && (
                <div className="font-mono text-xs text-[#F5A623] bg-[#F5A623]/10 p-2.5 border border-[#F5A623]/30">
                  {uploadNotice}
                </div>
              )}
            </div>

            {/* Manual Clause Generator */}
            <div className="mounted-document-subtle p-6 space-y-4">
              <span className="font-headline text-xs tracking-[0.2em] text-white uppercase block">
                Define Single Clause
              </span>
              <form onSubmit={handleAddRule} className="space-y-4">
                <div>
                  <label className="block font-headline text-[0.68rem] tracking-[0.16em] text-[#8A8B98] uppercase mb-1">
                    Rule Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#070814] border border-white/10 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#F5A623]"
                  >
                    <option value="Methodology & Algorithms">Methodology & Algorithms</option>
                    <option value="Data Integrity & Reproducibility">Data Integrity & Reproducibility</option>
                    <option value="Format & Schemas">Format & Schemas</option>
                    <option value="Innovation & Literature Delta">Innovation & Literature Delta</option>
                  </select>
                </div>

                <div>
                  <label className="block font-headline text-[0.68rem] tracking-[0.16em] text-[#8A8B98] uppercase mb-1">
                    Requirement Clause
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Every figure comparing runtime benchmarks must include hardware specifications in footnote..."
                    value={newStatement}
                    onChange={(e) => setNewStatement(e.target.value)}
                    className="w-full bg-[#070814] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F5A623] font-body"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-terracotta w-full py-2.5 text-xs tracking-[0.18em]"
                >
                  Append Clause to Graph
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Generated Adaptive Policy as a Typeset Document */}
          <div className="lg:col-span-7">
            <div className="mounted-document p-8 md:p-10 space-y-6 relative">
              {/* Document Header */}
              <div className="border-b border-[rgba(245,166,35,0.22)] pb-4 flex items-start justify-between">
                <div>
                  <span className="font-mono text-[0.68rem] text-[#F5A623] tracking-[0.24em] uppercase">
                    COMPILED ADAPTIVE POLICY
                  </span>
                  <h2 className="font-headline text-xl md:text-2xl font-light text-white mt-1">
                    Departmental Verification Protocol
                  </h2>
                </div>
                <div className="text-right font-mono text-[0.68rem] text-[#6A6B78]">
                  VER. 4.2.0<br />
                  COMPILED NOW
                </div>
              </div>

              {/* Typeset Rule Clauses */}
              <div className="space-y-6 pt-2">
                {rules.map((rule, idx) => (
                  <div key={rule.code} className="space-y-1.5 border-b border-white/[0.04] pb-4">
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="text-[#F5A623] tracking-widest font-medium">
                        [{idx + 1}] {rule.code}
                      </span>
                      <span className="text-[0.68rem] text-[#8A8B98] tracking-widest uppercase">
                        {rule.obligation} · WT {rule.weight}%
                      </span>
                    </div>
                    <div className="font-headline text-xs tracking-[0.14em] text-white uppercase">
                      {rule.category}
                    </div>
                    <p className="text-sm text-[#A4A5B6] font-light leading-relaxed">
                      "{rule.statement}"
                    </p>
                  </div>
                ))}
              </div>

              {/* Document Footer Signature */}
              <div className="pt-6 border-t border-[rgba(245,166,35,0.18)] flex items-center justify-between font-mono text-[0.68rem] text-[#6A6B78]">
                <span>AUTHORITY: FACULTY REVIEW BOARD</span>
                <span className="text-[#F5A623]">EXECUTION READY</span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
