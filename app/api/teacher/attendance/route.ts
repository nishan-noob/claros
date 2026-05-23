import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createSessionSchema = z.object({
  subjectId: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'TEACHER') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const teacherId = parseInt(session.user.id);

  const sessions = await prisma.attendanceSession.findMany({
    where: { createdById: teacherId },
    include: {
      class: { select: { name: true } },
      subject: { select: { name: true } },
      _count: { select: { records: true } },
    },
    orderBy: { date: 'desc' },
    take: 20,
  });

  return NextResponse.json({ success: true, data: sessions });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'TEACHER') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const teacherId = parseInt(session.user.id);

  const body = await req.json();
  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const { subjectId, date, period } = parsed.data;

  // Verify teacher owns this subject
  const subject = await prisma.subject.findFirst({ where: { id: subjectId, teacherId } });
  if (!subject) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  // Find or create session (idempotent)
  const dateObj = new Date(date);

  const existing = await prisma.attendanceSession.findFirst({
    where: {
      classId: subject.classId,
      date: dateObj,
      subjectId,
      period: period ?? null,
    },
    include: { records: { include: { student: { select: { id: true, name: true, photoUrl: true } } } } },
  });

  if (existing) {
    return NextResponse.json({ success: true, data: existing, existing: true });
  }

  // Create new session
  const attendanceSession = await prisma.attendanceSession.create({
    data: {
      classId: subject.classId,
      date: dateObj,
      subjectId,
      period: period ?? null,
      createdById: teacherId,
    },
    include: { records: true },
  });

  return NextResponse.json({ success: true, data: attendanceSession, existing: false }, { status: 201 });
}
