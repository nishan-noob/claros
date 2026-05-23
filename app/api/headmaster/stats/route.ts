import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { startOfMonth } from 'date-fns';

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'HEADMASTER') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const [totalStudents, totalTeachers, totalClasses, attendanceThisMonth] = await Promise.all([
    prisma.student.count({ where: { active: true } }),
    prisma.user.count({ where: { role: 'TEACHER', active: true } }),
    prisma.class.count(),
    prisma.attendanceRecord.findMany({
      where: {
        session: {
          date: { gte: startOfMonth(new Date()) },
        },
      },
      select: { status: true },
    }),
  ]);

  const present = attendanceThisMonth.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
  const absent = attendanceThisMonth.filter((r) => r.status === 'ABSENT').length;
  const total = present + absent;
  const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

  return NextResponse.json({
    success: true,
    data: {
      totalStudents,
      totalTeachers,
      totalClasses,
      attendanceRate,
    },
  });
}
