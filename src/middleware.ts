import { NextResponse, type NextRequest } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';

const protectedRoutes = ['/dashboard', '/journal', '/insights', '/recap', '/chat', '/export'];
const authRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const user = await getUserFromCookie(request.cookies);

  // If trying to access a protected route without being authenticated, redirect to login
  if (!user && protectedRoutes.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If authenticated and trying to access an auth route, redirect to dashboard
  if (user && authRoutes.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If at root, redirect based on auth state
  if (pathname === '/') {
    const url = user ? '/dashboard' : '/login';
    return NextResponse.redirect(new URL(url, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (API routes, if any)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
