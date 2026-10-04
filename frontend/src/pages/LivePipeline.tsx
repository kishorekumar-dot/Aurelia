// src/pages/LivePipeline.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AureliaHeader } from '../components/AureliaHeader';
import { ParticleOrb3D } from '../components/ParticleOrb3D';
import { api } from '../services/api';

interface StageEvent {
  stage: string;
  status: 'done' | 'running' | 'idle' | 'failed' | string;
  index: number;
  total: number;
}

const STAGE_LABELS: Record<string, string> = {
  adaptive_policy: 'Policy',
  document_understanding: 'Understanding',
  format_agent: 'Format',
  content_agent: 'Content',
  innovation_agent: 'Innovation',
  consistency_agent: 'Consistency',
  evidence_construction: 'Evidence',
  evidence_sufficiency: 'Sufficiency',
  claim_classification: 'Classification',
  authority_decision: 'Authority',
  report_synthesis: 'Synthesis',
};

const STAGE_DESC: Record<string, string> = {
  adaptive_policy: 'Institutional Rubric Ingestion',
  document_understanding: 'Semantic AST & Claim Extraction',
  format_agent: 'Format Compliance Verification',
  content_agent: 'Content Depth Assessment',
  innovation_agent: 'Contribution Novelty Analysis',
  consistency_agent: 'Notation & Consistency Audit',
  evidence_construction: 'Cross-Figure & Citation Anchoring',
  evidence_sufficiency: 'Empirical Delta Verification',
  claim_classification: 'Claim Verification Classification',
  authority_decision: 'Lecturer Gateway Routing',
  report_synthesis: 'Report Generation & Synthesis',
};

export default function LivePipeline() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [stages, setStages] = useState<StageEvent[]>([]);
  const [reviewStatus, setReviewStatus] = useState<string>('RUNNING');
  const [currentStage, setCurrentStage] = useState<string>('');
  const [logs, setLogs] = useState<string[]>(['INIT: Pipeline starting...']);
  const [isComplete, setIsComplete] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pollStatus = async () => {
    if (!id) return;
    try {
      const data = await api.getReviewEvents(id);
      setStages(data.stages);
      setReviewStatus(data.status);
      setCurrentStage(data.current_stage);

      const runningStage = data.stages.find(s => s.status === 'running');
      if (runningStage) {
        const label = STAGE_LABELS[runningStage.stage] || runningStage.stage;
        setLogs(prev => {
          const lastLog = prev[prev.length - 1];
          const newLog = `[STAGE ${runningStage.index}/${runningStage.total}] Running ${label}...`;
          if (lastLog !== newLog) return [...prev, newLog];
          return prev;
        });
      }

      if (data.status === 'COMPLETED') {
        setIsComplete(true);
        setLogs(prev => [...prev, 'COMPLETE: Verification pipeline finished. Folio report generated.']);
        if (pollRef.current) clearInterval(pollRef.current);
      } else if (data.status === 'FAILED') {
        setHasFailed(true);
        setLogs(prev => [...prev, 'ERROR: Pipeline encountered a failure. Please re-run or check server logs.']);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  };

  useEffect(() => {
    if (!id) return;
    pollStatus();
    pollRef.current = setInterval(pollStatus, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id]);

  const orbStatus = hasFailed ? 'idle' : isComplete ? 'complete' : 'running';

  return (
    <div className="min-h-screen bg-[#050508] text-[#E8E8EE] flex flex-col font-body">
      <AureliaHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pt-28 pb-16 space-y-12">
        {/* Header with Small Particle Orb Status Indicator */}
        <div className="border-b border-[rgba(245,166,35,0.18)] pb-6 flex items-center justify-between">
          <div>
            <span className="font-mono text-xs text-[#F5A623] tracking-[0.24em] uppercase block mb-1">
              Multi-Agent Orchestration · Review #{id}
            </span>
            <h1 className="font-headline text-3xl md:text-4xl font-light text-white tracking-wide">
              Live Pipeline Stream
            </h1>
            <p className="text-xs font-mono text-[#8A8B98] mt-1">
              Current Stage: <span className="text-[#F5A623]">{currentStage || 'Initializing...'}</span>
            </p>
          </div>

          {/* Small Orb Status Indicator */}
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 relative flex items-center justify-center">
              <ParticleOrb3D size={80} status={orbStatus} />
            </div>
            <div className="text-right hidden sm:block">
              <div className={`font-mono text-xs tracking-wider uppercase ${
                isComplete ? 'text-[#F5A623]' : hasFailed ? 'text-red-400' : 'text-[#7B6CFF]'
              }`}>
                {isComplete ? 'EVALUATION COMPLETE' : hasFailed ? 'PIPELINE FAILED' : 'AGENTS IN FLIGHT'}
              </div>
              <div className="font-mono text-[0.68rem] text-[#6A6B78]">
                {isComplete ? '100% AUDIT RATIO' : hasFailed ? 'CHECK LOGS' : `STAGE: ${currentStage || '...'}`}
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Typeset Pipeline */}
        <div className="mounted-document p-8 overflow-x-auto">
          {stages.length === 0 ? (
            <div className="font-mono text-xs text-[#8A8B98] text-center py-4">Awaiting pipeline stages...</div>
          ) : (
            <div className="min-w-[900px] flex items-start justify-between relative">
              {/* Connecting Baseline Line */}
              <div className="absolute left-6 right-6 top-5 h-px bg-white/[0.08] -z-0" />

              {stages.map((stage, index) => {
                const isPast = stage.status === 'done';
                const isCurrent = stage.status === 'running';
                const isFailed = stage.status === 'failed';

                return (
                  <div key={stage.stage} className="relative z-10 flex flex-col items-center text-center flex-1 group px-1">
                    {/* Node Circle */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-mono text-xs transition-all duration-500 ${
                        isFailed
                          ? 'border-2 border-red-400 bg-red-400/20 text-red-400 shadow-[0_0_16px_rgba(239,68,68,0.5)]'
                          : isCurrent
                          ? 'border-2 border-[#F5A623] bg-[#050508] text-[#F5A623] shadow-[0_0_18px_rgba(245,166,35,0.7)]'
                          : isPast
                          ? 'border border-[#7B6CFF] bg-[#7B6CFF]/20 text-[#6EC8FF]'
                          : 'border border-white/15 bg-[#070814] text-[#6A6B78]'
                      }`}
                    >
                      {isPast ? '✓' : `${index + 1}`.padStart(2, '0')}
                    </div>

                    {/* Node Label */}
                    <div
                      className={`mt-3 font-headline text-xs tracking-[0.16em] uppercase transition-colors ${
                        isCurrent ? 'text-[#F5A623] font-normal' : isPast ? 'text-white' : 'text-[#6A6B78]'
                      }`}
                    >
                      {STAGE_LABELS[stage.stage] || stage.stage}
                    </div>

                    {/* Node Subtitle */}
                    <div className="mt-1 font-mono text-[0.62rem] text-[#8A8B98] leading-tight max-w-[100px]">
                      {STAGE_DESC[stage.stage] || ''}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Terminal Diagnostic Logs */}
        <div className="mounted-document-subtle p-6 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 text-[#6A6B78]">
            <span className="tracking-widest uppercase text-[0.68rem] text-[#F5A623]">
              Agent Trace Stream
            </span>
            <span className="text-[0.68rem]">
              STATUS: <span className={reviewStatus === 'COMPLETED' ? 'text-green-400' : reviewStatus === 'FAILED' ? 'text-red-400' : 'text-[#7B6CFF]'}>{reviewStatus}</span>
            </span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pt-2">
            {logs.map((log, idx) => (
              <div key={idx} className="text-[#A4A5B6]">
                <span className="text-[#F5A623] mr-2">&gt;</span>
                {log}
              </div>
            ))}
          </div>

          {(isComplete || hasFailed) && (
            <div className="pt-4 border-t border-[rgba(245,166,35,0.22)] flex items-center justify-between">
              {isComplete ? (
                <>
                  <span className="text-[#F5A623] font-bold">
                    Verification complete. Folio report generated with full evidence anchors.
                  </span>
                  <button
                    onClick={() => navigate(`/reviews/${id}`)}
                    className="btn-terracotta px-6 py-2.5 text-xs tracking-[0.18em]"
                  >
                    Inspect Folio Report →
                  </button>
                </>
              ) : (
                <>
                  <span className="text-red-400 font-bold">
                    Pipeline failed. Please re-run or check document format.
                  </span>
                  <button
                    onClick={async () => {
                      await api.rerunReview(id!);
                      setIsComplete(false);
                      setHasFailed(false);
                      setLogs(['REINIT: Re-running pipeline...']);
                      pollRef.current = setInterval(pollStatus, 2000);
                    }}
                    className="btn-terracotta px-6 py-2.5 text-xs tracking-[0.18em]"
                  >
                    Re-Run Pipeline →
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
