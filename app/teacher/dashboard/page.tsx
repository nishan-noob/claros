'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';

interface Subject {
  id: number;
  name: string;
  class: { id: number; name: string };
}

export default function TeacherDashboard() {
  const router = useRouter();

  const { data, isLoading } = useQuery<{ success: boolean; data: Subject[] }>({
    queryKey: ['teacher-subjects'],
    queryFn: () => fetch('/api/teacher/subjects').then((r) => r.json()),
  });

  const subjects = data?.data ?? [];
  const today = formatDate(new Date());

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Today&apos;s Classes</h1>
        <p className="text-sm text-slate-500 mt-0.5">{today}</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : subjects.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-slate-400 text-sm">
            No subjects assigned yet. Contact the headmaster.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {subjects.map((s) => (
            <Card key={s.id} className="border border-slate-200">
              <CardContent className="py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800">{s.name}</p>
                  <p className="text-sm text-slate-500">{s.class.name}</p>
                </div>
                <Button
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-xs px-3"
                  onClick={() =>
                    router.push(`/teacher/attendance?subjectId=${s.id}`)
                  }
                >
                  Take Attendance
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-16 flex-col gap-1 text-sm"
            onClick={() => router.push('/teacher/grades')}
          >
            <span className="text-lg">📊</span>
            Enter Grades
          </Button>
          <Button
            variant="outline"
            className="h-16 flex-col gap-1 text-sm"
            onClick={() => router.push('/teacher/students')}
          >
            <span className="text-lg">👥</span>
            My Students
          </Button>
        </div>
      </div>
    </div>
  );
}
