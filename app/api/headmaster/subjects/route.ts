import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createSubjectSchema = z.object({
  name: z.string().min(1),
  classId: z.number().int().positive(),
  teacherId: z.number().int().positive(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'HEADMASTER') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get('classId');

  const subjects = await prisma.subject.findMany({
    where: classId ? { classId: parseInt(classId) } : {},
    include: {
      class: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
    },
    orderBy: [{ class: { name: 'asc' } }, { name: 'asc' }],
  });

  return NextResponse.json({ success: true, data: subjects });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'HEADMASTER') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSubjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const subject = await prisma.subject.create({
    data: parsed.data,
    include: {
      class: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ success: true, data: subject }, { status: 201 });
}
