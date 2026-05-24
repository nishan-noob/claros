'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/SearchableSelect';
import { StudentAvatar } from '@/components/StudentAvatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, UserX, Link2 } from 'lucide-react';
import { toast } from 'sonner';

interface Student {
  id: number;
  name: string;
  studentCode: string;
  active: boolean;
  photoUrl?: string | null;
  class: { id: number; name: string };
  parent?: { id: number; name: string; email: string } | null;
}

interface ClassOption { id: number; name: string; }
interface ParentOption { id: number; name: string; email: string; }

function useStudents(search: string) {
  return useQuery<{ success: boolean; data: Student[] }>({
    queryKey: ['headmaster-students', search],
    queryFn: () => fetch(`/api/headmaster/students?search=${encodeURIComponent(search)}`).then((r) => r.json()),
  });
}

function useClasses() {
  return useQuery<{ success: boolean; data: ClassOption[] }>({
    queryKey: ['headmaster-classes-list'],
    queryFn: () => fetch('/api/headmaster/classes').then((r) => r.json()),
  });
}

function useParents() {
  return useQuery<{ success: boolean; data: ParentOption[] }>({
    queryKey: ['headmaster-parents'],
    queryFn: () =>
      fetch('/api/headmaster/accounts?role=PARENT').then((r) => r.json()),
  });
}

export default function StudentsPage() {
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState<number | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useStudents(search);
  const { data: classesData } = useClasses();
  const { data: parentsData } = useParents();

  const students = data?.data ?? [];
  const classes = classesData?.data ?? [];
  const parents = parentsData?.data ?? [];

  const addMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch('/api/headmaster/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Student added');
        qc.invalidateQueries({ queryKey: ['headmaster-students'] });
        setAddOpen(false);
      } else {
        toast.error('Failed to add student');
      }
    },
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, ...body }: { id: number; [k: string]: unknown }) =>
      fetch(`/api/headmaster/students/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Student updated');
        qc.invalidateQueries({ queryKey: ['headmaster-students'] });
        setLinkOpen(null);
      } else {
        toast.error('Failed to update');
      }
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Students</h1>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Student</DialogTitle></DialogHeader>
            <AddStudentForm classes={classes} onSubmit={(data) => addMutation.mutate(data)} loading={addMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search students…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </div>
      ) : students.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-400">No students found.</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {students.map((s) => (
            <Card key={s.id} className={!s.active ? 'opacity-50' : ''}>
              <CardContent className="py-3 flex items-center gap-3">
                <StudentAvatar name={s.name} photoUrl={s.photoUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-800 truncate">{s.name}</p>
                    <span className="text-xs text-slate-400 font-mono">{s.studentCode}</span>
                    {!s.active && <Badge variant="secondary">Inactive</Badge>}
                  </div>
                  <p className="text-xs text-slate-500">
                    {s.class.name}
                    {s.parent && <> · Parent: {s.parent.name}</>}
                    {!s.parent && <> · <span className="text-amber-600">No parent linked</span></>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setLinkOpen(s.id)}>
                        <Link2 className="w-3.5 h-3.5 mr-1.5" />
                        {s.parent ? 'Relink' : 'Link Parent'}
                      </Button>
                    <Dialog open={linkOpen === s.id} onOpenChange={(o) => setLinkOpen(o ? s.id : null)}>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Link Parent — {s.name}</DialogTitle></DialogHeader>
                      <LinkParentForm
                        parents={parents}
                        currentParentId={s.parent?.id}
                        onSubmit={(parentId) => patchMutation.mutate({ id: s.id, parentId })}
                        loading={patchMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-red-600"
                    onClick={() => patchMutation.mutate({ id: s.id, active: !s.active })}
                  >
                    <UserX className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AddStudentForm({
  classes,
  onSubmit,
  loading,
}: {
  classes: ClassOption[];
  onSubmit: (data: Record<string, unknown>) => void;
  loading: boolean;
}) {
  const [name, setName] = useState('');
  const [classId, setClassId] = useState('');
  const [dob, setDob] = useState('');

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
      </div>
      <div className="space-y-1.5">
        <Label>Class</Label>
        <Select value={classId} onValueChange={(v) => v !== null && setClassId(v)}>
          <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
          <SelectContent>
            {classes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Date of Birth (optional)</Label>
        <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
      </div>
      <Button
        className="w-full bg-indigo-600 hover:bg-indigo-700"
        disabled={loading || !name || !classId}
        onClick={() => onSubmit({ name, classId: parseInt(classId), dateOfBirth: dob || undefined })}
      >
        {loading ? 'Adding…' : 'Add Student'}
      </Button>
    </div>
  );
}

function LinkParentForm({
  parents,
  currentParentId,
  onSubmit,
  loading,
}: {
  parents: ParentOption[];
  currentParentId?: number;
  onSubmit: (parentId: number) => void;
  loading: boolean;
}) {
  const [parentId, setParentId] = useState(currentParentId ? String(currentParentId) : '');

  const options = parents.map((p) => ({
    value: String(p.id),
    label: p.name,
    sublabel: p.email,
  }));

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label>Parent Account</Label>
        <p className="text-xs text-slate-400">Start typing a name or email to filter</p>
        <SearchableSelect
          options={options}
          value={parentId}
          onChange={setParentId}
          placeholder="Select parent…"
          searchPlaceholder="Search by name or email…"
        />
      </div>
      <Button
        className="w-full bg-indigo-600 hover:bg-indigo-700"
        disabled={loading || !parentId}
        onClick={() => onSubmit(parseInt(parentId))}
      >
        {loading ? 'Saving…' : 'Link Parent'}
      </Button>
    </div>
  );
}
