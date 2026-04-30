import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/landing'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Root path: unauthenticated users see the landing page (URL stays as /)
  if (pathname === '/') {
    const token = req.cookies.get('cw_token')?.value;
    if (!token) {
      return NextResponse.rewrite(new URL('/landing', req.url));
    }
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get('cw_token')?.value;
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
