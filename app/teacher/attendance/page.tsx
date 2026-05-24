'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AttendanceMarker, StudentRecord } from '@/components/AttendanceMarker';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ClipboardList, History } from 'lucide-react';

interface Subject { id: number; name: string; class: { id: number; name: string }; }
interface Student { id: number; name: string; photoUrl?: string | null; class: { id: number; name: string }; }
interface AttendanceRecord { studentId: number; status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'; note?: string | null; }
interface HistorySession {
  id: number;
  date: string;
  class: { name: string };
  subject: { name: string };
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
}

export default function TeacherAttendancePage() {
  const searchParams = useSearchParams();
  const urlSubjectId = searchParams.get('subjectId');

  const [view, setView] = useState<'take' | 'history'>('take');
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

  const { data: historyData, isLoading: loadingHistory } = useQuery<{ success: boolean; data: HistorySession[] }>({
    queryKey: ['teacher-attendance-history'],
    queryFn: () => fetch('/api/teacher/attendance').then((r) => r.json()),
    enabled: view === 'history',
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

  // History view
  if (step === 1 && view === 'history') {
    const sessions = historyData?.data ?? [];
    return (
      <div className="p-4 space-y-4">
        {/* Tab bar */}
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setView('take')}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm font-medium rounded-md text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ClipboardList className="w-4 h-4" />
            Take Attendance
          </button>
          <button
            onClick={() => setView('history')}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm font-medium rounded-md bg-white shadow text-indigo-600 transition-colors"
          >
            <History className="w-4 h-4" />
            History
          </button>
        </div>

        <h1 className="text-lg font-bold text-slate-900">Attendance History</h1>

        {loadingHistory ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : sessions.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-slate-400 text-sm">
              No sessions recorded yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => {
              const pct = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;
              const pctColor = pct >= 90 ? 'text-emerald-600' : pct >= 70 ? 'text-amber-600' : 'text-red-500';
              return (
                <Card key={s.id}>
                  <CardContent className="py-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{s.subject.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{s.class.name} · {format(new Date(s.date), 'EEE, MMM d yyyy')}</p>
                        <div className="flex gap-3 mt-1.5 text-xs">
                          <span className="text-emerald-600 font-medium">{s.present} Present</span>
                          {s.absent > 0 && <span className="text-red-500 font-medium">{s.absent} Absent</span>}
                          {s.late > 0 && <span className="text-amber-500 font-medium">{s.late} Late</span>}
                          {s.excused > 0 && <span className="text-sky-500 font-medium">{s.excused} Excused</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-bold ${pctColor}`}>{pct}%</span>
                        <p className="text-xs text-slate-400">{s.total} students</p>
                      </div>
                    </div>
                    {/* Mini progress bar */}
                    <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="p-4 space-y-6">
        {/* Tab bar */}
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setView('take')}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm font-medium rounded-md bg-white shadow text-indigo-600 transition-colors"
          >
            <ClipboardList className="w-4 h-4" />
            Take Attendance
          </button>
          <button
            onClick={() => setView('history')}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm font-medium rounded-md text-slate-500 hover:text-slate-700 transition-colors"
          >
            <History className="w-4 h-4" />
            History
          </button>
        </div>

        <div className="space-y-2">
          <h1 className="text-lg font-bold text-slate-900">Select Subject</h1>
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
          <Label>Select Date</Label>
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
