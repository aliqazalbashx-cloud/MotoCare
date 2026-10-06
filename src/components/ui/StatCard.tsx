import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: string;
  accentColor?: 'red' | 'amber' | 'emerald' | 'blue' | 'zinc';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  trend,
  accentColor = 'red',
}) => {
  const accentBorder = {
    red: 'hover:border-rose-500/40',
    amber: 'hover:border-amber-500/40',
    emerald: 'hover:border-emerald-500/40',
    blue: 'hover:border-sky-500/40',
    zinc: 'hover:border-zinc-700',
  }[accentColor];

  const iconBg = {
    red: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    blue: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    zinc: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  }[accentColor];

  return (
    <div
      className={`bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 shadow-lg backdrop-blur-sm transition duration-200 ${accentBorder}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {label}
        </span>
        {icon && (
          <div className={`p-2 rounded-xl border ${iconBg}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-extrabold text-zinc-100 tracking-tight">
          {value}
        </span>
        {trend && (
          <span className="text-xs font-medium text-emerald-400">{trend}</span>
        )}
      </div>

      {subtext && (
        <p className="text-xs text-zinc-400 mt-1 font-medium">{subtext}</p>
      )}
    </div>
  );
};
