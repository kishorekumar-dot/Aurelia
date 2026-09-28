// src/components/ui/StatusBadge.tsx
import React from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle, XCircle, Bot, UserCheck, ShieldCheck } from 'lucide-react';

interface StatusBadgeProps {
  status: 'VERIFIED' | 'SUPPORTED' | 'NEEDS_REVIEW' | 'CONTRADICTED' | 'APPROVED' | 'REJECTED' | 'MODIFIED';
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showIcon = true,
  className = ''
}) => {
  const configMap = {
    VERIFIED: {
      label: 'Verified',
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      icon: CheckCircle2
    },
    SUPPORTED: {
      label: 'Supported',
      bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
      icon: ShieldCheck
    },
    NEEDS_REVIEW: {
      label: 'Needs Lecturer Review',
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      icon: AlertTriangle
    },
    CONTRADICTED: {
      label: 'Contradicted',
      bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
      icon: XCircle
    },
    APPROVED: {
      label: 'Lecturer Approved',
      bg: 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300',
      icon: UserCheck
    },
    REJECTED: {
      label: 'Lecturer Rejected',
      bg: 'bg-rose-600/20 border-rose-500/50 text-rose-300',
      icon: XCircle
    },
    MODIFIED: {
      label: 'Lecturer Modified',
      bg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
      icon: HelpCircle
    }
  };

  const config = configMap[status] || configMap.NEEDS_REVIEW;
  const IconComponent = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${config.bg} ${className}`}>
      {showIcon && <IconComponent className="w-3.5 h-3.5 shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
};

export const AuthorityBadge: React.FC<{ authority: 'AUTOMATIC' | 'QUALIFIED_AI' | 'LECTURER'; className?: string }> = ({
  authority,
  className = ''
}) => {
  const authorityMap = {
    AUTOMATIC: { label: 'Automatic', bg: 'bg-slate-800 text-slate-300 border-slate-700', icon: Bot },
    QUALIFIED_AI: { label: 'Qualified AI', bg: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60', icon: Bot },
    LECTURER: { label: 'Lecturer Review', bg: 'bg-purple-950/60 text-purple-300 border-purple-800/60', icon: UserCheck }
  };

  const config = authorityMap[authority] || authorityMap.AUTOMATIC;
  const IconComponent = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${config.bg} ${className}`}>
      <IconComponent className="w-3 h-3 shrink-0" />
      <span>{config.label}</span>
    </span>
  );
};
