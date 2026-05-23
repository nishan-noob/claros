'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AttendanceMarker, StudentRecord } from '@/components/AttendanceMarker';
import { toast } from 'sonner';

interface Subject { id: number; name: string; class: { id: number; name: string }; }
interface Student { id: number; name: string; photoUrl?: string | null; class: { id: number; name: string }; }
interface AttendanceRecord { studentId: number; status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'; note?: string | null; }

export default function TeacherAttendancePage() {
  const searchParams = useSearchParams();
  const urlSubjectId = searchParams.get('subjectId');

  const [step, setStep] = useState<1 | 2 | 3>(urlSubjectId ? 2 : 1);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(urlSubjectId ? parseInt(urlSubjectId) : null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [existingRecords, setExistingRecords] = useState<AttendanceRecord[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: subjectsData, isLoading: loadingSubjects } = useQuery<{ success: boolean; data: Subject[] }>({
    queryKey: ['teacher-subjects'],
    queryFn: () => fetch('/api/teacher/subjects').then((r) => r.json()),
  });

  const { data: studentsData, isLoading: loadingStudents } = useQuery<{ success: boolean; data: Student[] }>({
    queryKey: ['teacher-students'],
    queryFn: () => fetch('/api/teacher/students').then((r) => r.json()),
    enabled: step === 3,
  });

  const subjects = subjectsData?.data ?? [];
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  const studentsForSubject = (studentsData?.data ?? []).filter(
    (s) => s.class.id === selectedSubject?.class.id
  );

  const createSessionMutation = useMutation({
    mutationFn: (data: { subjectId: number; date: string }) =>
      fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.success) {
        setSessionId(res.data.id);
        if (res.existing && res.data.records?.length > 0) {
          setExistingRecords(res.data.records.map((r: { studentId: number; status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'; note?: string | null }) => ({
            studentId: r.studentId,
            status: r.status,
            note: r.note,
          })));
          setIsEditing(true);
          toast.info('Loaded existing session');
        }
        setStep(3);
      } else {
        toast.error('Failed to create session');
      }
    },
  });

  async function handleSave(records: StudentRecord[]) {
    if (!sessionId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/teacher/attendance/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: records.map((r) => ({ studentId: r.studentId, status: r.status, note: r.note ?? null })) }),
      }).then((r) => r.json());

      if (res.success) {
        toast.success('Attendance saved!');
      } else {
        toast.error('Failed to save');
      }
    } finally {
      setSaving(false);
    }
  }

  if (step === 1) {
    return (
      <div className="p-4 space-y-6">
        <h1 className="text-xl font-bold text-slate-900">Take Attendance</h1>
        <div className="space-y-2">
          <Label>Step 1: Select Subject</Label>
          {loadingSubjects ? <Skeleton className="h-12 w-full" /> : (
            <div className="space-y-2">
              {subjects.map((s) => (
                <Card
                  key={s.id}
                  className="cursor-pointer hover:border-indigo-400 transition-colors"
                  onClick={() => { setSelectedSubjectId(s.id); setStep(2); }}
                >
                  <CardContent className="py-3">
                    <p className="font-medium text-slate-800">{s.name}</p>
                    <p className="text-sm text-slate-500">{s.class.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setStep(1)}>← Back</Button>
          <h1 className="text-xl font-bold text-slate-900">Take Attendance</h1>
        </div>
        <p className="text-sm text-slate-600">
          <strong>{selectedSubject?.name}</strong> · {selectedSubject?.class.name}
        </p>
        <div className="space-y-2">
          <Label>Step 2: Select Date</Label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full"
          />
        </div>
        <Button
          className="w-full bg-indigo-600 hover:bg-indigo-700 h-12"
          disabled={createSessionMutation.isPending}
          onClick={() => createSessionMutation.mutate({ subjectId: selectedSubjectId!, date: selectedDate })}
        >
          {createSessionMutation.isPending ? 'Loading…' : 'Continue to Mark Attendance'}
        </Button>
      </div>
    );
  }

  // Step 3: Mark attendance
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2 border-b border-slate-200">
        <Button variant="ghost" size="sm" onClick={() => setStep(2)}>← Back</Button>
        <div>
          <h1 className="text-base font-bold text-slate-900">{selectedSubject?.name}</h1>
          <p className="text-xs text-slate-500">{selectedSubject?.class.name} · {selectedDate}</p>
        </div>
        {isEditing && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full ml-auto">Editing</span>}
      </div>

      {loadingStudents ? (
        <div className="p-4 space-y-3">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : (
        <AttendanceMarker
          students={studentsForSubject}
          initialRecords={existingRecords}
          onSave={handleSave}
          saving={saving}
          isEditing={isEditing}
        />
      )}
    </div>
  );
}
