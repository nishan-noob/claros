'use client';

import { cn } from '@/lib/utils';

interface AttendanceRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function AttendanceRing({
  percentage,
  size = 120,
  strokeWidth = 10,
  label,
}: AttendanceRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const color =
    percentage >= 90
      ? 'text-emerald-500'
      : percentage >= 75
      ? 'text-amber-500'
      : 'text-red-500';

  const strokeColor =
    percentage >= 90
      ? '#10b981'
      : percentage >= 75
      ? '#f59e0b'
      : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-2xl font-bold', color)}>{percentage}%</span>
        </div>
      </div>
      {label && <span className="text-sm text-slate-500">{label}</span>}
    </div>
  );
}
