import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Edge-compatible middleware: only checks cookie presence.
// Full role-based auth (with DB) is enforced server-side in each layout.tsx.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionToken =
    request.cookies.get('authjs.session-token') ??
    request.cookies.get('__Secure-authjs.session-token') ??
    request.cookies.get('next-auth.session-token') ??
    request.cookies.get('__Secure-next-auth.session-token');

  const isLoggedIn = !!sessionToken;

  if (pathname === '/login' && isLoggedIn) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const protectedPrefixes = ['/headmaster', '/teacher', '/parent'];
  if (protectedPrefixes.some((p) => pathname.startsWith(p)) && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/headmaster/:path*',
    '/teacher/:path*',
    '/parent/:path*',
  ],
};

