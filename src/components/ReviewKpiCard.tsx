import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface ReviewKpiCardProps {
  name: string;
  value: string | number;
  icon: LucideIcon;
  trendLabel?: string;
  trendValue?: string;
  trendStatus?: 'up' | 'down' | 'neutral';
  className?: string;
  subtitle?: string;
}

export const ReviewKpiCard: React.FC<ReviewKpiCardProps> = ({
  name,
  value,
  icon: Icon,
  trendLabel,
  trendValue,
  trendStatus,
  className,
  subtitle
}) => {
  return (
    <div className={cn("bg-white p-space-5 rounded-xl border border-neutral-200 custom-shadow-sm flex flex-col min-h-[140px]", className)}>
      <div className="flex items-center justify-between mb-space-2">
        <div className="flex items-center gap-space-2 text-neutral-500">
          <Icon className="w-4 h-4 text-primary-600" />
          <span className="text-[12px] font-bold uppercase tracking-widest font-mono">{name}</span>
        </div>
        {trendStatus && (
           <div className={cn(
            "flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg",
            trendStatus === 'up' ? "bg-success-50 text-success-700 border border-success-100" :
            trendStatus === 'down' ? "bg-critical-50 text-critical-700 border border-critical-100" :
            "bg-neutral-50 text-neutral-600 border border-neutral-200"
          )}>
            {trendStatus === 'up' ? '↑' : trendStatus === 'down' ? '↓' : ''} {trendValue}
          </div>
        )}
      </div>
      
      <div className="mt-auto">
        <div className="flex items-baseline gap-2">
           <span className="text-[32px] leading-[40px] font-bold text-neutral-900 font-sans tracking-tight">{value}</span>
           {subtitle && <span className="text-neutral-400 text-[14px] font-medium">{subtitle}</span>}
        </div>
        {trendLabel && <p className="text-[11px] text-neutral-400 font-medium uppercase mt-1">{trendLabel}</p>}
      </div>
    </div>
  );
};
