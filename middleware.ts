import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default auth((req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role;

  const isLoggedIn = !!session;

  // Redirect authenticated users away from login
  if (pathname === '/login' && isLoggedIn) {
    return NextResponse.redirect(new URL(dashboardFor(role), req.url));
  }

  // Protect role-specific routes
  if (pathname.startsWith('/headmaster')) {
    if (!isLoggedIn) return NextResponse.redirect(new URL('/login', req.url));
    if (role !== 'HEADMASTER') return NextResponse.redirect(new URL(dashboardFor(role), req.url));
  }

  if (pathname.startsWith('/teacher')) {
    if (!isLoggedIn) return NextResponse.redirect(new URL('/login', req.url));
    if (role !== 'TEACHER') return NextResponse.redirect(new URL(dashboardFor(role), req.url));
  }

  if (pathname.startsWith('/parent')) {
    if (!isLoggedIn) return NextResponse.redirect(new URL('/login', req.url));
    if (role !== 'PARENT') return NextResponse.redirect(new URL(dashboardFor(role), req.url));
  }

  return NextResponse.next();
});

function dashboardFor(role: string | undefined): string {
  switch (role) {
    case 'HEADMASTER': return '/headmaster/dashboard';
    case 'TEACHER': return '/teacher/dashboard';
    case 'PARENT': return '/parent/dashboard';
    default: return '/login';
  }
}

export const config = {
  matcher: [
    '/login',
    '/headmaster/:path*',
    '/teacher/:path*',
    '/parent/:path*',
  ],
};
