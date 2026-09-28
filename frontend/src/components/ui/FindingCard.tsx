// src/components/ui/FindingCard.tsx
import React from 'react';
import type { Finding } from '../../types';
import { StatusBadge, AuthorityBadge } from './StatusBadge';
import { FileText, ArrowRight, Shield } from 'lucide-react';

interface FindingCardProps {
  finding: Finding;
  onSelect?: (finding: Finding) => void;
  isCompact?: boolean;
}

export const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  onSelect,
  isCompact = false
}) => {
  const severityColors = {
    INFO: 'border-l-blue-500',
    MINOR: 'border-l-slate-400',
    MAJOR: 'border-l-amber-500',
    CRITICAL: 'border-l-rose-500'
  };

  return (
    <div 
      className={`group relative rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-blue-500/40 p-5 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-0.5 border-l-4 ${severityColors[finding.severity]}`}
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-blue-400 font-semibold border border-slate-700">
            {finding.category}
          </span>
          {finding.location?.page && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-500" />
              Page {finding.location.page}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <AuthorityBadge authority={finding.authority} />
          <StatusBadge status={finding.status} />
        </div>
      </div>

      {/* Claim Headline */}
      <h4 className="text-slate-100 font-semibold text-base mb-2 group-hover:text-blue-300 transition-colors">
        {finding.claim}
      </h4>

      {/* Policy Reference & Evidence Snippet */}
      {!isCompact && (
        <div className="mt-3 space-y-2">
          {finding.policy_rule && (
            <div className="flex items-start gap-2 text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <Shield className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-300 mr-1.5">{finding.policy_id}:</span>
                <span>{finding.policy_rule}</span>
              </div>
            </div>
          )}

          {finding.evidence && finding.evidence.length > 0 && (
            <div className="text-xs text-slate-300 bg-blue-950/20 border border-blue-900/30 p-2.5 rounded-lg">
              <span className="font-semibold text-blue-400 block mb-1">Evidence Detected:</span>
              <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
                "{finding.evidence[0].observation}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      {onSelect && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {finding.evidence ? `${finding.evidence.length} evidence node(s)` : 'Traceable finding'}
          </span>
          <button
            onClick={() => onSelect(finding)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors group-hover:translate-x-1 duration-200"
          >
            <span>View Evidence & Policy</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
