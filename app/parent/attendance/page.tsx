'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { attendanceRate } from '@/lib/calculations';
import { format } from 'date-fns';

interface Child { id: number; name: string; }
interface AttendanceRecord {
  id: number;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  session: { date: string; subject: { name: string } };
}

const STATUS_STYLES = {
  PRESENT: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  ABSENT: 'bg-red-50 text-red-700 border border-red-200',
  LATE: 'bg-amber-50 text-amber-700 border border-amber-200',
  EXCUSED: 'bg-sky-50 text-sky-700 border border-sky-200',
};

function getMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({ value: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy') });
  }
  return options;
}

export default function ParentAttendancePage() {
  const months = getMonthOptions();
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(months[0].value);

  const { data: childrenData, isLoading: loadingChildren } = useQuery<{ success: boolean; data: Child[] }>({
    queryKey: ['parent-children'],
    queryFn: () => fetch('/api/parent/children').then((r) => r.json()),
  });

  useEffect(() => {
    if (childrenData?.data && childrenData.data.length > 0 && !selectedChildId) {
      setSelectedChildId(childrenData.data[0].id);
    }
  }, [childrenData]);

  const { data: recordsData, isLoading: loadingRecords } = useQuery<{ success: boolean; data: AttendanceRecord[] }>({
    queryKey: ['parent-attendance', selectedChildId, selectedMonth],
    queryFn: () => fetch(`/api/parent/attendance?childId=${selectedChildId}&month=${selectedMonth}`).then((r) => r.json()),
    enabled: !!selectedChildId,
  });

  const children = childrenData?.data ?? [];
  const records = recordsData?.data ?? [];

  const stats = useMemo(() => {
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const excused = records.filter((r) => r.status === 'EXCUSED').length;
    return { present, absent, late, excused, rate: Math.round(attendanceRate(present, absent, late, excused)) };
  }, [records]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Attendance</h1>

      {children.length > 1 && (
        <Select value={selectedChildId?.toString() ?? ''} onValueChange={(v) => v !== null && setSelectedChildId(parseInt(v))}>
          <SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
          <SelectContent>{children.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      )}

      <Select value={selectedMonth} onValueChange={(v) => v !== null && setSelectedMonth(v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{months.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
      </Select>

      {loadingRecords ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : (
        <>
          {/* Summary row */}
          {records.length > 0 && (
            <Card>
              <CardContent className="py-3">
                <div className="grid grid-cols-4 gap-1 text-center text-xs mb-2">
                  <div><p className="font-semibold text-emerald-600">{stats.present}</p><p className="text-slate-400">Present</p></div>
                  <div><p className="font-semibold text-red-500">{stats.absent}</p><p className="text-slate-400">Absent</p></div>
                  <div><p className="font-semibold text-amber-500">{stats.late}</p><p className="text-slate-400">Late</p></div>
                  <div><p className="font-semibold text-sky-500">{stats.excused}</p><p className="text-slate-400">Excused</p></div>
                </div>
                <div className="text-center text-sm font-semibold text-slate-700">Rate: {stats.rate}%</div>
              </CardContent>
            </Card>
          )}

          {/* Records list */}
          {records.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-slate-400 text-sm">No records for this month.</CardContent></Card>
          ) : (
            <div className="space-y-1.5">
              {records.map((r) => (
                <Card key={r.id} className={STATUS_STYLES[r.status]}>
                  <CardContent className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{r.session.subject.name}</p>
                      <p className="text-xs opacity-70">{format(new Date(r.session.date), 'EEE, MMM d yyyy')}</p>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wide">{r.status}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
