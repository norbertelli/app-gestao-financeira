import React from 'react';
import { Crown, Sparkles } from 'lucide-react';

interface ProBadgeProps {
  size?: 'xs' | 'sm' | 'md';
  variant?: 'gold' | 'purple' | 'emerald';
  label?: string;
  className?: string;
  onClick?: () => void;
}

export const ProBadge: React.FC<ProBadgeProps> = ({
  size = 'xs',
  variant = 'gold',
  label = 'PRO',
  className = '',
  onClick,
}) => {
  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-sm px-3 py-1 gap-2',
  }[size];

  const variantClasses = {
    gold: 'bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-600/20 text-amber-300 border border-amber-500/40 shadow-xs shadow-amber-500/10',
    purple: 'bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-purple-600/20 text-purple-300 border border-purple-500/40 shadow-xs shadow-purple-500/10',
    emerald: 'bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-xs shadow-emerald-500/10',
  }[variant];

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center font-extrabold uppercase tracking-wider rounded-lg transition-all ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
      } ${variantClasses} ${sizeClasses} ${className}`}
    >
      <Crown className={size === 'xs' ? 'w-2.5 h-2.5 text-amber-400' : 'w-3.5 h-3.5 text-amber-400'} />
      <span>{label}</span>
      {size !== 'xs' && <Sparkles className="w-2.5 h-2.5 text-amber-300 animate-pulse" />}
    </span>
  );
};
