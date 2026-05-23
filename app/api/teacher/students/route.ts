import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'TEACHER') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const teacherId = parseInt(session.user.id);

  // Get classes this teacher teaches
  const subjects = await prisma.subject.findMany({
    where: { teacherId },
    select: { classId: true },
  });
  const classIds = [...new Set(subjects.map((s) => s.classId))];

  const students = await prisma.student.findMany({
    where: { classId: { in: classIds }, active: true },
    include: { class: { select: { id: true, name: true } } },
    orderBy: [{ class: { name: 'asc' } }, { name: 'asc' }],
  });

  return NextResponse.json({ success: true, data: students });
}
