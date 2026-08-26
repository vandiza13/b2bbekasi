import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, isAuthConfigured, verifySessionToken } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  if (!isAuthConfigured()) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const valid = token
    ? await verifySessionToken(token, process.env.AUTH_SECRET as string)
    : false;

  if (valid) {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/api')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loginUrl = new URL('/login', req.url);
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/', '/upload', '/api/kpi/stats', '/api/kpi/upload', '/api/telegram/broadcast'],
};
