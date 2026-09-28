// src/components/ui/Drawer.tsx
import React, { useEffect } from 'react';
import type { Finding } from '../../types';
import { StatusBadge, AuthorityBadge } from './StatusBadge';
import { Button } from './Button';
import { X, CheckCircle, XCircle, Shield, FileText, AlertTriangle, Cpu } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  finding: Finding | null;
  onAction?: (action: 'APPROVED' | 'REJECTED' | 'MODIFIED', findingId: number, notes?: string) => void;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  finding,
  onAction
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !finding) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-2xl bg-slate-900 border-l border-slate-800 shadow-2xl h-full flex flex-col z-10 overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Finding #{finding.id}
              </span>
              <StatusBadge status={finding.status} />
              <AuthorityBadge authority={finding.authority} />
            </div>
            <h3 className="text-xl font-bold text-white leading-snug">
              {finding.claim}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Finding Location & Severity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span className="text-xs text-slate-400 block mb-1">Document Location</span>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Page {finding.location?.page || 'N/A'}</span>
                {finding.location?.section && <span className="text-slate-500">({finding.location.section})</span>}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span className="text-xs text-slate-400 block mb-1">Severity & Authority</span>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>{finding.severity} Severity</span>
              </div>
            </div>
          </div>

          {/* Applicable Policy */}
          {finding.policy_rule && (
            <div className="p-5 rounded-xl bg-purple-950/20 border border-purple-900/30">
              <div className="flex items-center gap-2 mb-2 text-purple-300 font-semibold text-sm">
                <Shield className="w-4 h-4 text-purple-400" />
                <span>Applicable Policy Rule ({finding.policy_id})</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                {finding.policy_rule}
              </p>
            </div>
          )}

          {/* Evidence Details */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>Extracted Evidence & Analysis</span>
            </h4>
            {finding.evidence && finding.evidence.length > 0 ? (
              <div className="space-y-3">
                {finding.evidence.map((ev, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">{ev.method || 'Layout Analysis'}</span>
                      <span className="text-emerald-400 font-mono font-semibold">
                        {(ev.confidence * 100).toFixed(0)}% Confidence
                      </span>
                    </div>
                    <p className="text-slate-200 font-mono text-xs bg-slate-900/80 p-3 rounded border border-slate-800/60 leading-relaxed">
                      "{ev.observation}"
                    </p>
                    {ev.source && (
                      <span className="text-[11px] text-slate-500 block">Source: {ev.source}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No detailed evidence nodes attached.</p>
            )}
          </div>

          {/* AI Recommendation */}
          {finding.recommendation && (
            <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/30">
              <span className="text-xs font-semibold text-blue-400 block mb-1">Suggested Correction</span>
              <p className="text-slate-200 text-sm leading-relaxed">
                {finding.recommendation}
              </p>
            </div>
          )}
        </div>

        {/* Footer Lecturer Action Bar */}
        {onAction && (
          <div className="p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400">Lecturer Decision:</span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="!text-rose-400 hover:!bg-rose-500/20"
                icon={<XCircle className="w-4 h-4" />}
                onClick={() => onAction('REJECTED', finding.id)}
              >
                Reject Finding
              </Button>
              <Button
                size="sm"
                variant="primary"
                icon={<CheckCircle className="w-4 h-4" />}
                onClick={() => onAction('APPROVED', finding.id)}
              >
                Approve & Confirm
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
