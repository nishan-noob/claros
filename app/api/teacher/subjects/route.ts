import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'TEACHER') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const teacherId = parseInt(session.user.id);

  const subjects = await prisma.subject.findMany({
    where: { teacherId },
    include: {
      class: { select: { id: true, name: true, year: true } },
    },
    orderBy: [{ class: { name: 'asc' } }, { name: 'asc' }],
  });

  return NextResponse.json({ success: true, data: subjects });
}
