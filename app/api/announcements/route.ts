import { FEATURES } from '@/config/features';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
  if (!FEATURES.ANNOUNCEMENTS) {
    return NextResponse.json({ success: false, error: 'Feature not available' }, { status: 404 });
  }
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ success: true, data: [] });
}

export async function POST() {
  if (!FEATURES.ANNOUNCEMENTS) {
    return NextResponse.json({ success: false, error: 'Feature not available' }, { status: 404 });
  }
  const session = await auth();
  if (!session || session.user.role !== 'HEADMASTER') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ success: false, error: 'Not implemented' }, { status: 501 });
}
