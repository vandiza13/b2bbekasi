import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  isAuthConfigured,
} from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 5 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(req: NextRequest) {
  try {
    if (!isAuthConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Autentikasi belum dikonfigurasi. Isi AUTH_USERNAME, AUTH_PASSWORD, dan AUTH_SECRET di environment.',
      }, { status: 500 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    if (isRateLimited(ip)) {
      return NextResponse.json({
        success: false,
        error: 'Terlalu banyak percobaan login. Coba lagi dalam beberapa menit.',
      }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const username = String(body.username || '');
    const password = String(body.password || '');

    if (!safeEqual(username, process.env.AUTH_USERNAME as string) ||
        !safeEqual(password, process.env.AUTH_PASSWORD as string)) {
      return NextResponse.json({
        success: false,
        error: 'Username atau password salah',
      }, { status: 401 });
    }

    attempts.delete(ip);

    const token = await createSessionToken(process.env.AUTH_SECRET as string);
    const res = NextResponse.json({ success: true });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL_SECONDS,
    });
    return res;
  } catch (error) {
    console.error('[LoginAPI] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Terjadi kesalahan saat memproses login',
    }, { status: 500 });
  }
}
