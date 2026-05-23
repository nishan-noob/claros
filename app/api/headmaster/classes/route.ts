import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createClassSchema = z.object({
  name: z.string().min(1),
  year: z.string().min(1),
  homeroomTeacherId: z.number().int().positive().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'HEADMASTER') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const classes = await prisma.class.findMany({
    include: {
      homeroomTeacher: { select: { id: true, name: true } },
      _count: { select: { students: { where: { active: true } } } },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ success: true, data: classes });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'HEADMASTER') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createClassSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const cls = await prisma.class.create({
    data: parsed.data,
    include: {
      homeroomTeacher: { select: { id: true, name: true } },
      _count: { select: { students: true } },
    },
  });

  return NextResponse.json({ success: true, data: cls }, { status: 201 });
}
