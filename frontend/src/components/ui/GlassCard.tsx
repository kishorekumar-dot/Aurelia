// src/components/ui/GlassCard.tsx
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'blue' | 'purple' | 'cyan' | 'none';
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  glow = 'none',
  hoverEffect = true,
  onClick
}) => {
  const glowStyles = {
    none: '',
    blue: 'shadow-[0_0_30px_-5px_rgba(59,130,246,0.15)] border-blue-500/20',
    purple: 'shadow-[0_0_30px_-5px_rgba(139,92,246,0.15)] border-purple-500/20',
    cyan: 'shadow-[0_0_30px_-5px_rgba(6,182,212,0.15)] border-cyan-500/20',
  };

  const hoverClass = hoverEffect 
    ? "transition-all duration-300 hover:border-slate-600/80 hover:bg-slate-900/80 hover:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.6)] hover:-translate-y-0.5" 
    : "";

  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl bg-gradient-to-b from-slate-900/80 to-slate-950/90 backdrop-blur-xl border border-slate-800/80 p-6 overflow-hidden ${glowStyles[glow]} ${hoverClass} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Subtle top inner highlight */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-400/10 to-transparent pointer-events-none" />
      {children}
    </div>
  );
};
