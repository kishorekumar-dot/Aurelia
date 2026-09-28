// src/components/ui/ProgressBar.tsx
import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  showPercent?: boolean;
  color?: 'blue' | 'purple' | 'emerald' | 'amber';
  height?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  showPercent = true,
  color = 'blue',
  height = 'md',
  className = ''
}) => {
  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const colorGradients = {
    blue: 'from-blue-600 via-blue-500 to-cyan-400',
    purple: 'from-purple-600 via-indigo-500 to-purple-400',
    emerald: 'from-emerald-600 to-teal-400',
    amber: 'from-amber-600 to-yellow-400',
  };

  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-medium text-slate-300">
          {label && <span>{label}</span>}
          {showPercent && <span className="font-mono">{Math.round(clampedValue)}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50 ${heightStyles[height]}`}>
        <div
          className={`h-full bg-gradient-to-r ${colorGradients[color]} transition-all duration-500 ease-out rounded-full shadow-sm`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};
