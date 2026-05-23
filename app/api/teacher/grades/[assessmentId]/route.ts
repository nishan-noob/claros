import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const bulkGradeSchema = z.object({
  grades: z.array(z.object({
    studentId: z.number().int().positive(),
    score: z.number().nullable(),
    remarks: z.string().optional().nullable(),
  })),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== 'TEACHER') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const teacherId = parseInt(session.user.id);
  const { assessmentId } = await params;

  const assessment = await prisma.assessment.findFirst({
    where: { id: parseInt(assessmentId), createdById: teacherId },
  });
  if (!assessment) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

  const grades = await prisma.studentGrade.findMany({
    where: { assessmentId: parseInt(assessmentId) },
    include: { student: { select: { id: true, name: true, photoUrl: true } } },
    orderBy: { student: { name: 'asc' } },
  });

  return NextResponse.json({ success: true, data: grades });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== 'TEACHER') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const teacherId = parseInt(session.user.id);
  const { assessmentId } = await params;

  const assessment = await prisma.assessment.findFirst({
    where: { id: parseInt(assessmentId), createdById: teacherId },
  });
  if (!assessment) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const parsed = bulkGradeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });

  await prisma.$transaction(
    parsed.data.grades.map((g) =>
      prisma.studentGrade.upsert({
        where: { assessmentId_studentId: { assessmentId: parseInt(assessmentId), studentId: g.studentId } },
        update: { score: g.score, remarks: g.remarks ?? null },
        create: {
          assessmentId: parseInt(assessmentId),
          studentId: g.studentId,
          score: g.score,
          remarks: g.remarks ?? null,
          gradedById: teacherId,
        },
      })
    )
  );

  return NextResponse.json({ success: true, data: null });
}
