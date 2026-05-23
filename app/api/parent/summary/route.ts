import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { startOfMonth } from 'date-fns';
import { attendanceRate } from '@/lib/calculations';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'PARENT') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const parentId = parseInt(session.user.id);
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get('childId');

  if (!childId) {
    return NextResponse.json({ success: false, error: 'childId required' }, { status: 400 });
  }

  // Verify parent owns this child
  const child = await prisma.student.findFirst({
    where: { id: parseInt(childId), parentId },
    select: { id: true, name: true, photoUrl: true, class: { select: { name: true } } },
  });

  if (!child) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const [allAttendance, monthAttendance, recentGrades] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: { studentId: child.id },
      select: { status: true },
    }),
    prisma.attendanceRecord.findMany({
      where: { studentId: child.id, session: { date: { gte: startOfMonth(new Date()) } } },
      select: { status: true },
    }),
    prisma.studentGrade.findMany({
      where: { studentId: child.id, score: { not: null } },
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        score: true,
        assessment: { select: { title: true, maxScore: true, subject: { select: { name: true } } } },
        createdAt: true,
      },
    }),
  ]);

  function counts(records: { status: string }[]) {
    return {
      present: records.filter((r) => r.status === 'PRESENT').length,
      absent: records.filter((r) => r.status === 'ABSENT').length,
      late: records.filter((r) => r.status === 'LATE').length,
      excused: records.filter((r) => r.status === 'EXCUSED').length,
    };
  }

  const allCounts = counts(allAttendance);
  const monthCounts = counts(monthAttendance);

  return NextResponse.json({
    success: true,
    data: {
      child,
      allTimeRate: attendanceRate(allCounts.present, allCounts.absent, allCounts.late, allCounts.excused),
      monthRate: attendanceRate(monthCounts.present, monthCounts.absent, monthCounts.late, monthCounts.excused),
      recentGrades,
    },
  });
}
