import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-zinc-800/80 bg-zinc-900/40">
      <div className="p-3.5 bg-zinc-800/60 text-zinc-400 rounded-2xl border border-zinc-700/50 mb-4 shadow-inner">
        <Icon className="w-8 h-8 text-rose-500/80" />
      </div>
      <h3 className="text-base font-bold text-zinc-100 mb-1 tracking-tight">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 active:scale-[0.98] transition shadow-lg shadow-rose-950/30"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
