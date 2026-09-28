// src/pages/LivePipeline.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AureliaHeader } from '../components/AureliaHeader';
import { ParticleOrb3D } from '../components/ParticleOrb3D';

interface PipelineNode {
  id: string;
  label: string;
  description: string;
}

const PIPELINE_NODES: PipelineNode[] = [
  { id: 'rules', label: 'Rules', description: 'Institutional Rubric Ingestion' },
  { id: 'policy', label: 'Policy', description: 'Adaptive Graph Formulation' },
  { id: 'understanding', label: 'Understanding', description: 'Semantic AST & Claim Extraction' },
  { id: 'agents', label: 'Agents', description: 'Format · Content · Innovation Triad' },
  { id: 'evidence', label: 'Evidence', description: 'Cross-Figure & Citation Anchorage' },
  { id: 'sufficiency', label: 'Sufficiency', description: 'Empirical Delta Verification' },
  { id: 'decision', label: 'Decision', description: 'Lecturer Gateway Routing' },
];

export default function LivePipeline() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    'INIT: Parsing dissertation AST tokens [64,820 words]...',
    'RULES: Binding CS Postgrad v4.2 policy clauses...',
  ]);

  useEffect(() => {
    if (activeStep < PIPELINE_NODES.length - 1) {
      const timer = setTimeout(() => {
        setActiveStep((prev) => {
          const next = prev + 1;
          const nodeName = PIPELINE_NODES[next].label.toUpperCase();
          setLogs((l) => [
            ...l,
            `[CYCLE ${next + 1}/7] Verified ${nodeName}: ${PIPELINE_NODES[next].description}`,
          ]);
          return next;
        });
      }, 1600);
      return () => clearTimeout(timer);
    } else {
      setIsComplete(true);
    }
  }, [activeStep]);

  return (
    <div className="min-h-screen bg-[#050508] text-[#E8E8EE] flex flex-col font-body">
      <AureliaHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pt-28 pb-16 space-y-12">
        {/* Header with Small Particle Orb Status Indicator */}
        <div className="border-b border-[rgba(245,166,35,0.18)] pb-6 flex items-center justify-between">
          <div>
            <span className="font-mono text-xs text-[#F5A623] tracking-[0.24em] uppercase block mb-1">
              Multi-Agent Orchestration
            </span>
            <h1 className="font-headline text-3xl md:text-4xl font-light text-white tracking-wide">
              Live Pipeline Stream
            </h1>
            <p className="text-xs font-mono text-[#8A8B98] mt-1">
              TARGET: Alex Rivera — Smart Storage Monitoring System using IoT
            </p>
          </div>

          {/* Small Orb Status Indicator */}
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 relative flex items-center justify-center">
              <ParticleOrb3D
                size={80}
                status={isComplete ? 'complete' : 'running'}
              />
            </div>
            <div className="text-right hidden sm:block">
              <div className={`font-mono text-xs tracking-wider uppercase ${isComplete ? 'text-[#F5A623]' : 'text-[#7B6CFF]'}`}>
                {isComplete ? 'EVALUATION COMPLETE' : 'AGENTS IN FLIGHT'}
              </div>
              <div className="font-mono text-[0.68rem] text-[#6A6B78]">
                {isComplete ? '100% AUDIT RATIO' : `STAGE ${activeStep + 1} OF 7`}
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Typeset Pipeline on Dark */}
        <div className="mounted-document p-8 overflow-x-auto">
          <div className="min-w-[820px] flex items-center justify-between relative">
            {/* Connecting Baseline Line */}
            <div className="absolute left-6 right-6 top-5 h-px bg-white/[0.08] -z-0" />

            {PIPELINE_NODES.map((node, index) => {
              const isPast = index < activeStep || isComplete;
              const isCurrent = index === activeStep && !isComplete;

              return (
                <div key={node.id} className="relative z-10 flex flex-col items-center text-center w-28 group">
                  {/* Node Circle */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-mono text-xs transition-all duration-500 ${
                      isCurrent
                        ? 'border-2 border-[#F5A623] bg-[#050508] text-[#F5A623] shadow-[0_0_18px_rgba(245,166,35,0.7)]'
                        : isPast
                        ? 'border border-[#7B6CFF] bg-[#7B6CFF]/20 text-[#6EC8FF]'
                        : 'border border-white/15 bg-[#070814] text-[#6A6B78]'
                    }`}
                  >
                    0{index + 1}
                  </div>

                  {/* Node Label */}
                  <div
                    className={`mt-3 font-headline text-xs tracking-[0.16em] uppercase transition-colors ${
                      isCurrent
                        ? 'text-[#F5A623] font-normal'
                        : isPast
                        ? 'text-white'
                        : 'text-[#6A6B78]'
                    }`}
                  >
                    {node.label}
                  </div>

                  {/* Node Subtitle */}
                  <div className="mt-1 font-mono text-[0.65rem] text-[#8A8B98] leading-tight max-w-[110px]">
                    {node.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Terminal Diagnostic Logs */}
        <div className="mounted-document-subtle p-6 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 text-[#6A6B78]">
            <span className="tracking-widest uppercase text-[0.68rem] text-[#F5A623]">
              Agent Trace Stream
            </span>
            <span className="text-[0.68rem]">BUFFER: OK</span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pt-2">
            {logs.map((log, idx) => (
              <div key={idx} className="text-[#A4A5B6]">
                <span className="text-[#F5A623] mr-2">&gt;</span>
                {log}
              </div>
            ))}
          </div>

          {isComplete && (
            <div className="pt-4 border-t border-[rgba(245,166,35,0.22)] flex items-center justify-between">
              <span className="text-[#F5A623] font-bold">
                Verification complete. Report generated with full evidence anchors.
              </span>
              <button
                onClick={() => navigate('/reviews/1')}
                className="btn-terracotta px-6 py-2.5 text-xs tracking-[0.18em]"
              >
                Inspect Folio Report →
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
