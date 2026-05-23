import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const createStudentSchema = z.object({
  name: z.string().min(1),
  classId: z.number().int().positive(),
  dateOfBirth: z.string().optional(),
  studentCode: z.string().optional(),
  parentId: z.number().int().positive().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'HEADMASTER') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') ?? '';
  const classId = searchParams.get('classId');

  const students = await prisma.student.findMany({
    where: {
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      ...(classId ? { classId: parseInt(classId) } : {}),
    },
    include: {
      class: { select: { id: true, name: true } },
      parent: { select: { id: true, name: true, email: true } },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ success: true, data: students });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'HEADMASTER') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createStudentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, classId, dateOfBirth, studentCode, parentId } = parsed.data;

  // Auto-generate student code if not provided
  let code = studentCode;
  if (!code) {
    const year = new Date().getFullYear();
    const highest = await prisma.student.findFirst({
      where: { studentCode: { startsWith: `${year}-` } },
      orderBy: { studentCode: 'desc' },
      select: { studentCode: true },
    });
    const seq = highest ? parseInt(highest.studentCode.split('-')[1]) : 0;
    code = `${year}-${String(seq + 1).padStart(3, '0')}`;
  }

  const student = await prisma.student.create({
    data: {
      name,
      classId,
      studentCode: code,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      parentId,
    },
    include: {
      class: { select: { id: true, name: true } },
      parent: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ success: true, data: student }, { status: 201 });
}
