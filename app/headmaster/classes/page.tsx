'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, ChevronRight, Users } from 'lucide-react';
import { toast } from 'sonner';

interface ClassItem {
  id: number;
  name: string;
  year: string;
  homeroomTeacher?: { id: number; name: string } | null;
  _count: { students: number };
}

interface Teacher { id: number; name: string; }

export default function ClassesPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<ClassItem | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ success: boolean; data: ClassItem[] }>({
    queryKey: ['headmaster-classes'],
    queryFn: () => fetch('/api/headmaster/classes').then((r) => r.json()),
  });

  const { data: teachersData } = useQuery<{ success: boolean; data: Teacher[] }>({
    queryKey: ['headmaster-teachers'],
    queryFn: () => fetch('/api/headmaster/teachers').then((r) => r.json()),
  });

  const { data: classDetailData, isLoading: loadingDetail } = useQuery({
    queryKey: ['headmaster-class-detail', selected?.id],
    queryFn: () => fetch(`/api/headmaster/classes/${selected!.id}`).then((r) => r.json()),
    enabled: !!selected,
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch('/api/headmaster/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Class created');
        qc.invalidateQueries({ queryKey: ['headmaster-classes'] });
        setAddOpen(false);
      } else {
        toast.error('Failed to create class');
      }
    },
  });

  const classes = data?.data ?? [];
  const teachers = teachersData?.data ?? [];
  const classDetail = classDetailData?.data;

  if (selected) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>← Back</Button>
          <h1 className="text-2xl font-bold text-slate-900">{selected.name}</h1>
        </div>

        {loadingDetail ? (
          <Skeleton className="h-40 w-full" />
        ) : classDetail ? (
          <>
            <Card>
              <CardHeader><CardTitle className="text-base">Class Info</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1 text-slate-600">
                <p>Year: <strong>{classDetail.year}</strong></p>
                <p>Homeroom Teacher: <strong>{classDetail.homeroomTeacher?.name ?? 'Not assigned'}</strong></p>
                <p>Total Students: <strong>{classDetail.students?.length ?? 0}</strong></p>
              </CardContent>
            </Card>
            <div>
              <h2 className="text-lg font-semibold mb-3">Students</h2>
              {classDetail.students?.length === 0 ? (
                <p className="text-slate-400 text-sm">No students enrolled.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {classDetail.students?.map((s: { id: number; name: string; studentCode: string }) => (
                    <Card key={s.id}>
                      <CardContent className="py-2.5 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                          {s.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{s.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{s.studentCode}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Classes</h1>
        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Class
            </Button>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Class</DialogTitle></DialogHeader>
            <CreateClassForm teachers={teachers} onSubmit={(d) => createMutation.mutate(d)} loading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : classes.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-slate-400">No classes yet.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {classes.map((c) => (
            <Card key={c.id} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setSelected(c)}>
              <CardContent className="py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{c.name}</p>
                  <p className="text-xs text-slate-500">
                    {c._count.students} students
                    {c.homeroomTeacher && <> · {c.homeroomTeacher.name}</>}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateClassForm({
  teachers,
  onSubmit,
  loading,
}: {
  teachers: Teacher[];
  onSubmit: (data: Record<string, unknown>) => void;
  loading: boolean;
}) {
  const [name, setName] = useState('');
  const [year, setYear] = useState('2025-2026');
  const [teacherId, setTeacherId] = useState('');

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label>Class Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grade 5A" />
      </div>
      <div className="space-y-1.5">
        <Label>Academic Year</Label>
        <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="2025-2026" />
      </div>
      <div className="space-y-1.5">
        <Label>Homeroom Teacher (optional)</Label>
        <Select value={teacherId} onValueChange={(v) => v !== null && setTeacherId(v)}>
          <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
          <SelectContent>
            {teachers.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button
        className="w-full bg-indigo-600 hover:bg-indigo-700"
        disabled={loading || !name || !year}
        onClick={() => onSubmit({ name, year, homeroomTeacherId: teacherId ? parseInt(teacherId) : undefined })}
      >
        {loading ? 'Creating…' : 'Create Class'}
      </Button>
    </div>
  );
}
