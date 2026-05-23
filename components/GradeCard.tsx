import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LetterGradeBadge } from '@/components/LetterGradeBadge';
import { subjectAverage } from '@/lib/calculations';

interface GradeCardProps {
  subjectName: string;
  grades: Array<{
    title: string;
    score: number | null;
    maxScore: number;
    type: string;
  }>;
}

export function GradeCard({ subjectName, grades }: GradeCardProps) {
  const avg = subjectAverage(grades.map((g) => ({ score: g.score, maxScore: g.maxScore })));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{subjectName}</CardTitle>
          {avg !== null && <LetterGradeBadge percentage={avg} />}
        </div>
        {avg !== null && (
          <p className="text-sm text-slate-500">Average: {avg}%</p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {grades.map((g, i) => {
          const pct = g.score !== null ? Math.round((g.score / g.maxScore) * 100) : null;
          return (
            <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-slate-100 last:border-0">
              <div>
                <span className="font-medium">{g.title}</span>
                <span className="ml-2 text-xs text-slate-400 uppercase">{g.type}</span>
              </div>
              <div className="flex items-center gap-2">
                {g.score !== null ? (
                  <>
                    <span className="text-slate-700">{g.score}/{g.maxScore}</span>
                    {pct !== null && <LetterGradeBadge percentage={pct} className="w-6 h-6 text-xs" />}
                  </>
                ) : (
                  <span className="text-slate-400 italic text-xs">Pending</span>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
