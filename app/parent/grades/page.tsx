'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { LetterGradeBadge } from '@/components/LetterGradeBadge';
import { subjectAverage, letterGrade } from '@/lib/calculations';

interface Child { id: number; name: string; }

interface Assessment {
  id: number;
  title: string;
  type: string;
  date: string;
  maxScore: number;
  grades: { score: number | null; remarks: string | null }[];
}

interface Subject {
  id: number;
  name: string;
  assessments: Assessment[];
}

export default function ParentGradesPage() {
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

  const { data: childrenData } = useQuery<{ success: boolean; data: Child[] }>({
    queryKey: ['parent-children'],
    queryFn: () => fetch('/api/parent/children').then((r) => r.json()),
  });

  useEffect(() => {
    if (childrenData?.data && childrenData.data.length > 0 && !selectedChildId) {
      setSelectedChildId(childrenData.data[0].id);
    }
  }, [childrenData]);

  const { data: gradesData, isLoading } = useQuery<{ success: boolean; data: Subject[] }>({
    queryKey: ['parent-grades', selectedChildId],
    queryFn: () => fetch(`/api/parent/grades?childId=${selectedChildId}`).then((r) => r.json()),
    enabled: !!selectedChildId,
  });

  const children = childrenData?.data ?? [];
  const subjects = gradesData?.data ?? [];

  // Compute overall average
  const allGrades: { score: number; maxScore: number }[] = [];
  subjects.forEach((s) => {
    s.assessments.forEach((a) => {
      if (a.grades[0]?.score !== null && a.grades[0]?.score !== undefined) {
        allGrades.push({ score: a.grades[0].score as number, maxScore: a.maxScore });
      }
    });
  });
  const overallAvg = allGrades.length > 0
    ? Math.round(allGrades.reduce((sum, g) => sum + (g.score / g.maxScore * 100), 0) / allGrades.length)
    : null;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Grades</h1>

      {children.length > 1 && (
        <Select value={selectedChildId?.toString() ?? ''} onValueChange={(v) => v !== null && setSelectedChildId(parseInt(v))}>
          <SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
          <SelectContent>{children.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      )}

      {overallAvg !== null && (
        <Card className="bg-indigo-50 border-indigo-200">
          <CardContent className="py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-indigo-700">Overall Average</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-indigo-900">{overallAvg}%</span>
              <LetterGradeBadge percentage={overallAvg} />
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : subjects.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-slate-400 text-sm">No grade data available yet.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {subjects.map((s) => {
            const subjectGrades = s.assessments
              .filter((a) => a.grades[0]?.score !== null && a.grades[0]?.score !== undefined)
              .map((a) => ({ score: a.grades[0].score as number, maxScore: a.maxScore }));
            const avg = subjectAverage(subjectGrades);
            const avgPct = avg !== null ? Math.round(avg) : null;

            return (
              <Card key={s.id}>
                <CardHeader className="pb-2 pt-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{s.name}</CardTitle>
                    {avgPct !== null && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-500">{avgPct}%</span>
                        <LetterGradeBadge percentage={avgPct} />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {s.assessments.length === 0 ? (
                    <p className="text-xs text-slate-400">No assessments yet.</p>
                  ) : (
                    s.assessments.map((a) => {
                      const grade = a.grades[0];
                      const pct = grade?.score !== null && grade?.score !== undefined
                        ? Math.round((grade.score as number / a.maxScore) * 100)
                        : null;
                      return (
                        <div key={a.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-slate-700">{a.title}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge variant="secondary" className="text-xs py-0">{a.type}</Badge>
                              {grade?.remarks && <span className="text-xs text-slate-400">{grade.remarks}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-right">
                            {pct !== null ? (
                              <>
                                <span className="text-sm text-slate-600">{grade!.score}/{a.maxScore}</span>
                                <LetterGradeBadge percentage={pct} />
                              </>
                            ) : (
                              <span className="text-xs text-slate-400">Pending</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
