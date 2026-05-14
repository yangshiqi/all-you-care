import { NextResponse, type NextRequest } from 'next/server';

const COOKIE_NAME = 'admin_token';
const PROTECTED_PREFIX = '/admin';
const LOGIN_PATH = '/admin/login';
const LOGIN_API = '/api/admin/login';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    if (pathname.startsWith(PROTECTED_PREFIX) || pathname.startsWith('/api/admin/')) {
      return NextResponse.json({ error: 'admin disabled' }, { status: 503 });
    }
    return NextResponse.next();
  }

  const requiresAuth =
    (pathname.startsWith(PROTECTED_PREFIX) && pathname !== LOGIN_PATH) ||
    (pathname.startsWith('/api/admin/') && pathname !== LOGIN_API);

  if (!requiresAuth) return NextResponse.next();

  const got = req.cookies.get(COOKIE_NAME)?.value;
  if (got === adminToken) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = LOGIN_PATH;
  url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
