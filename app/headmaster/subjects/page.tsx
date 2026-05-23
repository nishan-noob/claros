'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Subject { id: number; name: string; class: { id: number; name: string }; teacher: { id: number; name: string }; }
interface ClassOption { id: number; name: string; }
interface TeacherOption { id: number; name: string; }

export default function SubjectsPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ success: boolean; data: Subject[] }>({
    queryKey: ['headmaster-subjects'],
    queryFn: () => fetch('/api/headmaster/subjects').then((r) => r.json()),
  });

  const { data: classesData } = useQuery<{ success: boolean; data: ClassOption[] }>({
    queryKey: ['headmaster-classes-list'],
    queryFn: () => fetch('/api/headmaster/classes').then((r) => r.json()),
  });

  const { data: teachersData } = useQuery<{ success: boolean; data: TeacherOption[] }>({
    queryKey: ['headmaster-teachers'],
    queryFn: () => fetch('/api/headmaster/teachers').then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch('/api/headmaster/subjects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.success) { toast.success('Subject created'); qc.invalidateQueries({ queryKey: ['headmaster-subjects'] }); setAddOpen(false); }
      else toast.error('Failed');
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, ...body }: { id: number; [k: string]: unknown }) =>
      fetch(`/api/headmaster/subjects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['headmaster-subjects'] }); setEditSubject(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/headmaster/subjects/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['headmaster-subjects'] }); },
  });

  const subjects = data?.data ?? [];
  const classes = classesData?.data ?? [];
  const teachers = teachersData?.data ?? [];

  // Group by class
  const byClass: Record<string, Subject[]> = {};
  subjects.forEach((s) => {
    const key = s.class.name;
    if (!byClass[key]) byClass[key] = [];
    byClass[key].push(s);
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Subjects</h1>
        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Subject</Button>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Subject</DialogTitle></DialogHeader>
            <SubjectForm classes={classes} teachers={teachers} onSubmit={(d) => createMutation.mutate(d)} loading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : subjects.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-slate-400">No subjects yet.</CardContent></Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(byClass).sort(([a], [b]) => a.localeCompare(b)).map(([className, subs]) => (
            <div key={className}>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">{className}</h2>
              <div className="space-y-2">
                {subs.map((s) => (
                  <Card key={s.id}>
                    <CardContent className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-800">{s.name}</p>
                        <p className="text-xs text-slate-500">Teacher: {s.teacher.name}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditSubject(s)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => deleteMutation.mutate(s.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editSubject} onOpenChange={(o) => !o && setEditSubject(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Subject</DialogTitle></DialogHeader>
          {editSubject && (
            <SubjectForm
              classes={classes}
              teachers={teachers}
              initial={editSubject}
              onSubmit={(d) => editMutation.mutate({ id: editSubject.id, ...d })}
              loading={editMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubjectForm({ classes, teachers, initial, onSubmit, loading }: {
  classes: ClassOption[]; teachers: TeacherOption[];
  initial?: Subject; onSubmit: (d: Record<string, unknown>) => void; loading: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [classId, setClassId] = useState(initial ? String(initial.class.id) : '');
  const [teacherId, setTeacherId] = useState(initial ? String(initial.teacher.id) : '');

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label>Subject Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mathematics" />
      </div>
      {!initial && (
        <div className="space-y-1.5">
          <Label>Class</Label>
          <Select value={classId} onValueChange={(v) => v !== null && setClassId(v)}>
            <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
            <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-1.5">
        <Label>Teacher</Label>
        <Select value={teacherId} onValueChange={(v) => v !== null && setTeacherId(v)}>
          <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
          <SelectContent>{teachers.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Button
        className="w-full bg-indigo-600 hover:bg-indigo-700"
        disabled={loading || !name || (!initial && !classId) || !teacherId}
        onClick={() => onSubmit({ name, ...(classId ? { classId: parseInt(classId) } : {}), teacherId: parseInt(teacherId) })}
      >
        {loading ? 'Saving…' : initial ? 'Save Changes' : 'Add Subject'}
      </Button>
    </div>
  );
}
