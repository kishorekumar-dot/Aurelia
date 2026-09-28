// src/pages/Landing.tsx
import { Link } from 'react-router-dom';
import { AureliaHeader } from '../components/AureliaHeader';
import { ParticleOrb3D } from '../components/ParticleOrb3D';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#050508] text-[#E8E8EE] flex flex-col relative overflow-hidden font-body selection:bg-[#F5A623]/25 selection:text-[#F5A623]">
      {/* Universal Fixed Header */}
      <AureliaHeader />

      {/* Hero Section: Giant Particle Orb Centerpiece */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center pt-24 pb-12 px-6 overflow-hidden">
        {/* Subtle deep ambient glow behind the sphere */}
        <div className="absolute w-[680px] h-[680px] rounded-full bg-gradient-to-tr from-[#7B6CFF]/15 via-transparent to-[#F5A623]/15 blur-[120px] pointer-events-none -z-10" />

        {/* 3D Particle Sphere Centerpiece */}
        <div className="relative flex items-center justify-center">
          <ParticleOrb3D size={640} status="idle" />

          {/* Headline INSIDE the sphere, centered, white, large, light weight */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none select-none z-10">
            <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-light text-white leading-[1.12] tracking-tight max-w-2xl drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
              Review every project<br />
              <span className="font-normal text-white">with evidence,</span><br />
              <span className="text-[#E2E2EC]/90 font-light italic">not guesswork</span>
            </h1>
          </div>
        </div>

        {/* Footer line under the orb: small caps, wide tracking, muted gray */}
        <div className="mt-4 text-center z-10">
          <p className="font-headline text-[0.72rem] md:text-xs text-[#8A8B98] tracking-[0.24em] uppercase font-light">
            Adaptive multi-agent review for lecturer rules and student documents
          </p>
          <div className="mt-7 flex items-center justify-center gap-4">
            <Link
              to="/reviews/new"
              className="btn-terracotta px-7 py-3 text-xs tracking-[0.2em]"
            >
              Initiate Review
            </Link>
            <Link
              to="/dashboard"
              className="px-6 py-2.5 rounded-full border border-white/15 text-[#B4B5C4] hover:text-white hover:border-white/40 font-headline text-xs tracking-[0.18em] uppercase transition-all duration-300"
            >
              Enter Desk
            </Link>
          </div>
        </div>

        {/* Hairline bottom rule */}
        <div className="absolute bottom-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-[rgba(245,166,35,0.22)] to-transparent" />
      </section>

      {/* Below the Fold: Three Framed Sections on Dark Paper */}
      <section className="max-w-6xl w-full mx-auto px-6 py-24 space-y-20">
        
        {/* 01 Adaptive Policy */}
        <div className="mounted-document p-8 md:p-12 rounded-sm relative">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="md:w-1/3">
              <span className="font-mono text-xs text-[#F5A623] tracking-[0.2em] uppercase block mb-2">
                01 // Synthesis
              </span>
              <h2 className="font-headline text-2xl md:text-3xl font-light text-white tracking-wide">
                Adaptive Policy
              </h2>
            </div>
            <div className="md:w-2/3 space-y-4">
              <p className="text-[#A4A5B6] text-base leading-relaxed font-light">
                Institutional rubrics, syllabus stipulations, and lecturer grading policies are ingested and compiled into an executable rule graph. No rigid checklists; policies adapt to document domain and academic stage.
              </p>
              <div className="pt-4 border-t border-[rgba(245,166,35,0.15)] flex flex-wrap gap-8 font-mono text-xs text-[#8A8B98]">
                <div><span className="text-[#F5A623]">STANDARD:</span> IEEE / ACM / APA 7th</div>
                <div><span className="text-[#F5A623]">RESOLUTION:</span> Section & Paragraph Anchor</div>
                <div><span className="text-[#F5A623]">STATUS:</span> Enforced</div>
              </div>
            </div>
          </div>
        </div>

        {/* 02 Specialized Agents */}
        <div className="mounted-document p-8 md:p-12 rounded-sm relative">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="md:w-1/3">
              <span className="font-mono text-xs text-[#7B6CFF] tracking-[0.2em] uppercase block mb-2">
                02 // Tripartite Analysis
              </span>
              <h2 className="font-headline text-2xl md:text-3xl font-light text-white tracking-wide">
                Specialized Agents
              </h2>
              <div className="font-mono text-xs text-[#7B6CFF] tracking-[0.14em] mt-2 uppercase">
                Format · Content · Innovation
              </div>
            </div>
            <div className="md:w-2/3 space-y-6">
              <p className="text-[#A4A5B6] text-base leading-relaxed font-light">
                Three autonomous verification agents review the submission simultaneously against primary citations, dataset integrity, and methodological claims.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-[rgba(255,255,255,0.06)] font-body">
                <div className="space-y-1">
                  <div className="font-headline text-sm text-white tracking-wider uppercase font-normal">Format Agent</div>
                  <div className="font-mono text-xs text-[#8A8B98]">Typography, schema, citations, cross-figure labeling.</div>
                </div>
                <div className="space-y-1">
                  <div className="font-headline text-sm text-white tracking-wider uppercase font-normal">Content Agent</div>
                  <div className="font-mono text-xs text-[#8A8B98]">Empirical logic, claim verification, citation alignment.</div>
                </div>
                <div className="space-y-1">
                  <div className="font-headline text-sm text-white tracking-wider uppercase font-normal">Innovation Agent</div>
                  <div className="font-mono text-xs text-[#8A8B98]">Novelty index, literature delta, viva interrogation queries.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 03 Evidence -> Authority Decision */}
        <div className="mounted-document p-8 md:p-12 rounded-sm relative">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="md:w-1/3">
              <span className="font-mono text-xs text-[#F5A623] tracking-[0.2em] uppercase block mb-2">
                03 // Verification Chain
              </span>
              <h2 className="font-headline text-2xl md:text-3xl font-light text-white tracking-wide">
                Evidence → Decision
              </h2>
            </div>
            <div className="md:w-2/3 space-y-4">
              <p className="text-[#A4A5B6] text-base leading-relaxed font-light">
                Every deduction is anchored to verified textual extracts. High-confidence manuscripts receive instant audit certification; flagged anomalies are routed directly to the lecturer's terminal for authoritative override.
              </p>
              <div className="pt-4 border-t border-[rgba(245,166,35,0.15)] flex items-center justify-between font-mono text-xs text-[#8A8B98]">
                <span>ROUTING ARCHITECTURE: DUAL GATEWAY</span>
                <Link to="/rules" className="text-[#F5A623] hover:underline tracking-wider uppercase">
                  Inspect Rule Engine →
                </Link>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Minimalist Footer */}
      <footer className="border-t border-white/[0.06] py-10 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-headline text-[0.7rem] text-[#6A6B78] tracking-[0.2em] uppercase">
          <div>AURELIA ACADEMIC REVIEW ENGINE</div>
          <div>ESTABLISHED FOR RESEARCH RIGOR & VERIFIED TRUTH</div>
        </div>
      </footer>
    </div>
  );
}
