'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StudentAvatar } from '@/components/StudentAvatar';

interface Student {
  id: number;
  name: string;
  studentCode: string;
  photoUrl?: string | null;
  class: { id: number; name: string };
}

export default function TeacherStudentsPage() {
  const { data, isLoading } = useQuery<{ success: boolean; data: Student[] }>({
    queryKey: ['teacher-students'],
    queryFn: () => fetch('/api/teacher/students').then((r) => r.json()),
  });

  const students = data?.data ?? [];

  // Group by class
  const byClass: Record<string, Student[]> = {};
  students.forEach((s) => {
    if (!byClass[s.class.name]) byClass[s.class.name] = [];
    byClass[s.class.name].push(s);
  });

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold text-slate-900">My Students</h1>
      <p className="text-sm text-slate-500">{students.length} students across your classes</p>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : students.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-slate-400 text-sm">No students found.</CardContent></Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(byClass).sort(([a], [b]) => a.localeCompare(b)).map(([className, sts]) => (
            <div key={className}>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">{className}</h2>
              <div className="space-y-1.5">
                {sts.map((s) => (
                  <Card key={s.id}>
                    <CardContent className="py-2.5 flex items-center gap-3">
                      <StudentAvatar name={s.name} photoUrl={s.photoUrl} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{s.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{s.studentCode}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
