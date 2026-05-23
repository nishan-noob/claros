import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  type: z.enum(['EXAM', 'QUIZ', 'ASSIGNMENT', 'MIDTERM', 'FINAL', 'PROJECT']).optional(),
  date: z.string().optional(),
  maxScore: z.number().positive().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== 'TEACHER') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const teacherId = parseInt(session.user.id);

  const assessment = await prisma.assessment.findFirst({ where: { id: parseInt(id), createdById: teacherId } });
  if (!assessment) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });

  const { date, ...rest } = parsed.data;
  const updated = await prisma.assessment.update({
    where: { id: parseInt(id) },
    data: { ...rest, ...(date ? { date: new Date(date) } : {}) },
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== 'TEACHER') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const teacherId = parseInt(session.user.id);

  const assessment = await prisma.assessment.findFirst({ where: { id: parseInt(id), createdById: teacherId } });
  if (!assessment) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

  await prisma.assessment.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true, data: null });
}
