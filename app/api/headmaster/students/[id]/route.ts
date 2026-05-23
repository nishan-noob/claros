import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  classId: z.number().int().positive().optional(),
  dateOfBirth: z.string().nullable().optional(),
  parentId: z.number().int().positive().nullable().optional(),
  active: z.boolean().optional(),
  studentCode: z.string().optional(),
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

  const { dateOfBirth, ...rest } = parsed.data;

  const student = await prisma.student.update({
    where: { id: parseInt(id) },
    data: {
      ...rest,
      ...(dateOfBirth !== undefined
        ? { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null }
        : {}),
    },
    include: {
      class: { select: { id: true, name: true } },
      parent: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ success: true, data: student });
}
