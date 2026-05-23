import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AttendanceStatus } from '@prisma/client';

const recordSchema = z.object({
  studentId: z.number().int().positive(),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
  note: z.string().optional().nullable(),
});

const putSchema = z.object({
  records: z.array(recordSchema),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== 'TEACHER') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const teacherId = parseInt(session.user.id);
  const { id } = await params;

  const attendanceSession = await prisma.attendanceSession.findUnique({
    where: { id: parseInt(id) },
    include: {
      subject: { select: { teacherId: true } },
      records: {
        include: { student: { select: { id: true, name: true, photoUrl: true } } },
      },
    },
  });

  if (!attendanceSession) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }
  if (attendanceSession.subject?.teacherId !== teacherId) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ success: true, data: attendanceSession });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== 'TEACHER') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const teacherId = parseInt(session.user.id);
  const { id } = await params;
  const sessionId = parseInt(id);

  const attendanceSession = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: { subject: { select: { teacherId: true } } },
  });

  if (!attendanceSession) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }
  if (attendanceSession.subject?.teacherId !== teacherId) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
  }

  // Upsert all records in a transaction
  await prisma.$transaction(
    parsed.data.records.map((r) =>
      prisma.attendanceRecord.upsert({
        where: { sessionId_studentId: { sessionId, studentId: r.studentId } },
        update: { status: r.status as AttendanceStatus, note: r.note ?? null },
        create: { sessionId, studentId: r.studentId, status: r.status as AttendanceStatus, note: r.note ?? null },
      })
    )
  );

  return NextResponse.json({ success: true, data: null });
}
