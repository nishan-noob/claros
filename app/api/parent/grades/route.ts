import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'PARENT') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const parentId = parseInt(session.user.id);
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get('childId');

  if (!childId) {
    return NextResponse.json({ success: false, error: 'childId required' }, { status: 400 });
  }

  const child = await prisma.student.findFirst({
    where: { id: parseInt(childId), parentId },
    include: {
      class: {
        include: {
          subjects: {
            include: {
              assessments: {
                include: {
                  grades: {
                    where: { studentId: parseInt(childId) },
                    select: { score: true, remarks: true, createdAt: true },
                  },
                },
                orderBy: { date: 'asc' },
              },
            },
          },
        },
      },
    },
  });

  if (!child) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

  return NextResponse.json({ success: true, data: child.class.subjects });
}
