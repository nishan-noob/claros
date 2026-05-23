import { letterGrade } from '@/lib/calculations';
import { cn } from '@/lib/utils';

interface LetterGradeBadgeProps {
  percentage: number;
  className?: string;
}

const gradeColors: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  B: 'bg-blue-100 text-blue-700 border-blue-200',
  C: 'bg-amber-100 text-amber-700 border-amber-200',
  D: 'bg-orange-100 text-orange-700 border-orange-200',
  F: 'bg-red-100 text-red-700 border-red-200',
};

export function LetterGradeBadge({ percentage, className }: LetterGradeBadgeProps) {
  const grade = letterGrade(percentage);
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border',
        gradeColors[grade],
        className
      )}
    >
      {grade}
    </span>
  );
}
