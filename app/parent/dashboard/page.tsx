'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AttendanceRing } from '@/components/AttendanceRing';
import { StudentAvatar } from '@/components/StudentAvatar';
import { LetterGradeBadge } from '@/components/LetterGradeBadge';

interface Child { id: number; name: string; studentCode: string; photoUrl?: string | null; class: { id: number; name: string }; }

interface Summary {
  child: { id: number; name: string; photoUrl?: string | null; class: { name: string } };
  allTimeRate: number;
  monthRate: number;
  recentGrades: { score: number | null; assessment: { title: string; maxScore: number; subject: { name: string } }; createdAt: string }[];
}

export default function ParentDashboardPage() {
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

  const { data: childrenData, isLoading: loadingChildren } = useQuery<{ success: boolean; data: Child[] }>({
    queryKey: ['parent-children'],
    queryFn: () => fetch('/api/parent/children').then((r) => r.json()),
  });

  useEffect(() => {
    if (childrenData?.data && childrenData.data.length > 0 && !selectedChildId) {
      setSelectedChildId(childrenData.data[0].id);
    }
  }, [childrenData]);

  const { data: summaryData, isLoading: loadingSummary } = useQuery<{ success: boolean; data: Summary }>({
    queryKey: ['parent-summary', selectedChildId],
    queryFn: () => fetch(`/api/parent/summary?childId=${selectedChildId}`).then((r) => r.json()),
    enabled: !!selectedChildId,
  });

  const children = childrenData?.data ?? [];
  const summary = summaryData?.data;

  if (loadingChildren) {
    return <div className="p-4 space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>;
  }

  if (children.length === 0) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-4xl mb-4">👪</p>
        <h2 className="text-lg font-bold text-slate-800 mb-2">No children linked</h2>
        <p className="text-sm text-slate-500">Contact the school headmaster to link your account to your child&apos;s profile.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      {/* Child selector */}
      {children.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {children.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedChildId(c.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedChildId === c.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {loadingSummary || !summary ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : (
        <>
          {/* Child header */}
          <Card>
            <CardContent className="pt-5 pb-4 flex items-center gap-4">
              <StudentAvatar name={summary.child.name} photoUrl={summary.child.photoUrl} size="lg" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">{summary.child.name}</h2>
                <p className="text-sm text-slate-500">{summary.child.class.name}</p>
              </div>
            </CardContent>
          </Card>

          {/* Attendance rings */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-4 pb-4 flex flex-col items-center gap-2">
                <AttendanceRing percentage={Math.round(summary.allTimeRate)} size={80} strokeWidth={8} />
                <p className="text-xs font-medium text-slate-600 text-center">Overall Attendance</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 flex flex-col items-center gap-2">
                <AttendanceRing percentage={Math.round(summary.monthRate)} size={80} strokeWidth={8} />
                <p className="text-xs font-medium text-slate-600 text-center">This Month</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent grades */}
          {summary.recentGrades.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Recent Grades</h3>
              <div className="space-y-2">
                {summary.recentGrades.map((g, i) => {
                  const pct = g.score !== null ? Math.round((g.score / g.assessment.maxScore) * 100) : null;
                  return (
                    <Card key={i}>
                      <CardContent className="py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{g.assessment.title}</p>
                          <p className="text-xs text-slate-400">{g.assessment.subject.name}</p>
                        </div>
                        {pct !== null ? <LetterGradeBadge percentage={pct} /> : <span className="text-xs text-slate-400">Pending</span>}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
