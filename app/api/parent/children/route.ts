import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'PARENT') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const parentId = parseInt(session.user.id);

  const children = await prisma.student.findMany({
    where: { parentId, active: true },
    select: {
      id: true,
      name: true,
      studentCode: true,
      photoUrl: true,
      class: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ success: true, data: children });
}
