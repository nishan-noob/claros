'use client';

import { useState, useEffect } from 'react';
import { StudentAvatar } from '@/components/StudentAvatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Clock, FileText, Loader2 } from 'lucide-react';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface StudentRecord {
  studentId: number;
  name: string;
  photoUrl?: string | null;
  status: AttendanceStatus;
  note?: string;
}

interface AttendanceMarkerProps {
  students: Array<{ id: number; name: string; photoUrl?: string | null }>;
  initialRecords?: Array<{ studentId: number; status: AttendanceStatus; note?: string | null }>;
  onSave: (records: StudentRecord[]) => Promise<void>;
  saving?: boolean;
  isEditing?: boolean;
}

const STATUS_CYCLE: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  PRESENT: { label: 'Present', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-300', icon: CheckCircle2 },
  ABSENT: { label: 'Absent', color: 'text-red-700', bg: 'bg-red-100 border-red-300', icon: XCircle },
  LATE: { label: 'Late', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300', icon: Clock },
  EXCUSED: { label: 'Excused', color: 'text-sky-700', bg: 'bg-sky-100 border-sky-300', icon: FileText },
};

export function AttendanceMarker({
  students,
  initialRecords,
  onSave,
  saving = false,
  isEditing = false,
}: AttendanceMarkerProps) {
  const [records, setRecords] = useState<StudentRecord[]>(() =>
    students.map((s) => {
      const existing = initialRecords?.find((r) => r.studentId === s.id);
      return {
        studentId: s.id,
        name: s.name,
        photoUrl: s.photoUrl,
        status: existing?.status ?? 'PRESENT',
        note: existing?.note ?? undefined,
      };
    })
  );

  // Track original records for diff counting
  const [originalRecords] = useState<StudentRecord[]>(() =>
    students.map((s) => {
      const existing = initialRecords?.find((r) => r.studentId === s.id);
      return {
        studentId: s.id,
        name: s.name,
        photoUrl: s.photoUrl,
        status: existing?.status ?? 'PRESENT',
        note: existing?.note ?? undefined,
      };
    })
  );

  // Sync if initialRecords change (session loaded)
  useEffect(() => {
    if (initialRecords && initialRecords.length > 0) {
      setRecords(
        students.map((s) => {
          const existing = initialRecords.find((r) => r.studentId === s.id);
          return {
            studentId: s.id,
            name: s.name,
            photoUrl: s.photoUrl,
            status: existing?.status ?? 'PRESENT',
            note: existing?.note ?? undefined,
          };
        })
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRecords]);

  function cycleStatus(studentId: number) {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.studentId !== studentId) return r;
        const idx = STATUS_CYCLE.indexOf(r.status);
        const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
        return { ...r, status: next };
      })
    );
  }

  function setStatus(studentId: number, status: AttendanceStatus) {
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
    );
  }

  function markAllPresent() {
    setRecords((prev) => prev.map((r) => ({ ...r, status: 'PRESENT' })));
  }

  const counts = records.reduce(
    (acc, r) => {
      acc[r.status]++;
      return acc;
    },
    { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 } as Record<AttendanceStatus, number>
  );

  const diffCount = isEditing
    ? records.filter(
        (r) =>
          originalRecords.find((o) => o.studentId === r.studentId)?.status !== r.status
      ).length
    : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Counter bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-2">
        <div className="flex flex-wrap gap-3 text-sm font-medium">
          <span className="text-emerald-600">{counts.PRESENT} Present</span>
          <span className="text-slate-300">·</span>
          <span className="text-red-600">{counts.ABSENT} Absent</span>
          <span className="text-slate-300">·</span>
          <span className="text-amber-600">{counts.LATE} Late</span>
          <span className="text-slate-300">·</span>
          <span className="text-sky-600">{counts.EXCUSED} Excused</span>
          {isEditing && diffCount > 0 && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-indigo-600">{diffCount} change{diffCount !== 1 ? 's' : ''}</span>
            </>
          )}
        </div>
      </div>

      {/* Mark All Present */}
      <div className="px-4 py-2 border-b border-slate-100">
        <Button variant="outline" size="sm" onClick={markAllPresent} className="text-xs">
          Mark All Present
        </Button>
      </div>

      {/* Student list */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pb-24">
        {records.map((record) => {
          const cfg = STATUS_CONFIG[record.status];
          const StatusIcon = cfg.icon;
          return (
            <div
              key={record.studentId}
              className="flex items-center gap-3 px-4 min-h-[56px]"
            >
              <StudentAvatar name={record.name} photoUrl={record.photoUrl} size="sm" />
              <span className="flex-1 text-sm font-medium text-slate-800 truncate">
                {record.name}
              </span>
              {/* Quick 4-button row */}
              <div className="flex gap-1">
                {STATUS_CYCLE.map((s) => {
                  const c = STATUS_CONFIG[s];
                  const Icon = c.icon;
                  return (
                    <button
                      key={s}
                      onClick={() => setStatus(record.studentId, s)}
                      title={c.label}
                      className={cn(
                        'w-9 h-9 rounded-full border flex items-center justify-center transition-all',
                        record.status === s
                          ? cn(c.bg, c.color, 'border-2')
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky save */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 z-20"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
      >
        <Button
          className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-base font-semibold"
          onClick={() => onSave(records)}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            isEditing ? `Save ${diffCount > 0 ? `(${diffCount} changes)` : 'Attendance'}` : 'Save Attendance'
          )}
        </Button>
      </div>
    </div>
  );
}
