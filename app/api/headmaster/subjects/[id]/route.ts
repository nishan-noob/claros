import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  teacherId: z.number().int().positive().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== 'HEADMASTER') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const subject = await prisma.subject.update({
    where: { id: parseInt(id) },
    data: parsed.data,
    include: {
      class: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ success: true, data: subject });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== 'HEADMASTER') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  await prisma.subject.delete({ where: { id: parseInt(id) } });

  return NextResponse.json({ success: true, data: null });
}
