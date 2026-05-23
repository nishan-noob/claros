import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AssessmentType } from '@prisma/client';

const createSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['EXAM', 'QUIZ', 'ASSIGNMENT', 'MIDTERM', 'FINAL', 'PROJECT']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  maxScore: z.number().positive(),
  subjectId: z.number().int().positive(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'TEACHER') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const teacherId = parseInt(session.user.id);
  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get('subjectId');

  const assessments = await prisma.assessment.findMany({
    where: {
      createdById: teacherId,
      ...(subjectId ? { subjectId: parseInt(subjectId) } : {}),
    },
    include: {
      subject: { select: { id: true, name: true, class: { select: { name: true } } } },
      _count: { select: { grades: true } },
    },
    orderBy: { date: 'desc' },
  });

  return NextResponse.json({ success: true, data: assessments });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'TEACHER') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const teacherId = parseInt(session.user.id);
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, type, date, maxScore, subjectId } = parsed.data;

  // Verify teacher owns this subject
  const subject = await prisma.subject.findFirst({ where: { id: subjectId, teacherId } });
  if (!subject) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  // Get all students in this subject's class
  const students = await prisma.student.findMany({
    where: { classId: subject.classId, active: true },
    select: { id: true },
  });

  // Create assessment + empty grade rows in a transaction
  const assessment = await prisma.$transaction(async (tx) => {
    const a = await tx.assessment.create({
      data: {
        title,
        type: type as AssessmentType,
        date: new Date(date),
        maxScore,
        subjectId,
        createdById: teacherId,
      },
    });

    await tx.studentGrade.createMany({
      data: students.map((s) => ({
        assessmentId: a.id,
        studentId: s.id,
        score: null,
        gradedById: teacherId,
      })),
    });

    return a;
  });

  return NextResponse.json({ success: true, data: assessment }, { status: 201 });
}
