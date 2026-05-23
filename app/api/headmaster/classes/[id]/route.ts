import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  year: z.string().min(1).optional(),
  homeroomTeacherId: z.number().int().positive().nullable().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== 'HEADMASTER') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const cls = await prisma.class.findUnique({
    where: { id: parseInt(id) },
    include: {
      homeroomTeacher: { select: { id: true, name: true } },
      students: {
        where: { active: true },
        select: { id: true, name: true, studentCode: true, photoUrl: true },
        orderBy: { name: 'asc' },
      },
      subjects: {
        select: { id: true, name: true, teacher: { select: { id: true, name: true } } },
      },
    },
  });

  if (!cls) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

  return NextResponse.json({ success: true, data: cls });
}

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

  const cls = await prisma.class.update({
    where: { id: parseInt(id) },
    data: parsed.data,
    include: { homeroomTeacher: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ success: true, data: cls });
}
