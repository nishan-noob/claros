import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'PARENT') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const parentId = parseInt(session.user.id);
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get('childId');
  const month = searchParams.get('month'); // format: YYYY-MM

  if (!childId) {
    return NextResponse.json({ success: false, error: 'childId required' }, { status: 400 });
  }

  // Verify ownership
  const child = await prisma.student.findFirst({
    where: { id: parseInt(childId), parentId },
    select: { id: true },
  });
  if (!child) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

  let dateFilter = {};
  if (month) {
    const [year, m] = month.split('-').map(Number);
    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 1);
    dateFilter = { date: { gte: start, lt: end } };
  }

  const records = await prisma.attendanceRecord.findMany({
    where: {
      studentId: child.id,
      session: dateFilter,
    },
    include: {
      session: {
        select: {
          date: true,
          subject: { select: { name: true } },
        },
      },
    },
    orderBy: { session: { date: 'desc' } },
  });

  return NextResponse.json({ success: true, data: records });
}
