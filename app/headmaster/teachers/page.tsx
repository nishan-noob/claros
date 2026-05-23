'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap, UserX } from 'lucide-react';
import { toast } from 'sonner';

interface Teacher {
  id: number;
  name: string;
  email: string;
  active: boolean;
  taughtSubjects: Array<{ id: number; name: string; class: { name: string } }>;
}

export default function TeachersPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ success: boolean; data: Teacher[] }>({
    queryKey: ['headmaster-teachers'],
    queryFn: () => fetch('/api/headmaster/teachers').then((r) => r.json()),
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, ...body }: { id: number; [k: string]: unknown }) =>
      fetch(`/api/headmaster/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      toast.success('Updated');
      qc.invalidateQueries({ queryKey: ['headmaster-teachers'] });
    },
  });

  const teachers = data?.data ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Teachers</h1>
        <p className="text-sm text-slate-500">Manage teacher accounts in the Accounts section.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      ) : teachers.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-slate-400">No teachers found.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {teachers.map((t) => (
            <Card key={t.id} className={!t.active ? 'opacity-50' : ''}>
              <CardContent className="py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-slate-800">{t.name}</p>
                    {!t.active && <Badge variant="secondary">Inactive</Badge>}
                  </div>
                  <p className="text-xs text-slate-500">{t.email}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {t.taughtSubjects.map((s) => (
                      <span key={s.id} className="text-xs bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">
                        {s.name} · {s.class.name}
                      </span>
                    ))}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-red-600"
                  onClick={() => patchMutation.mutate({ id: t.id, active: !t.active })}
                >
                  <UserX className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
