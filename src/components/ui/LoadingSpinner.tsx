import React from 'react';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading MotorCare...',
  size = 'md',
}) => {
  const sizeClass = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[200px]">
      <div
        className={`${sizeClass} border-zinc-700 border-t-rose-500 rounded-full animate-spin mb-3`}
      />
      {label && <p className="text-xs sm:text-sm text-zinc-400 font-medium">{label}</p>}
    </div>
  );
};
