import { NextRequest } from 'next/server';

export const SESSION_COOKIE = 'bges_session';
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export function isAuthConfigured(): boolean {
  return Boolean(
    process.env.AUTH_USERNAME &&
    process.env.AUTH_PASSWORD &&
    process.env.AUTH_SECRET
  );
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function createSessionToken(secret: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const sig = await hmacHex(secret, String(exp));
  return `${exp}.${sig}`;
}

export async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  const [expStr, sig] = token.split('.');
  if (!expStr || !sig) return false;

  const exp = parseInt(expStr, 10);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return false;

  const expected = await hmacHex(secret, expStr);
  if (expected.length !== sig.length) return false;

  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return diff === 0;
}

export async function hasValidSession(req: NextRequest): Promise<boolean> {
  if (!isAuthConfigured()) return true;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return verifySessionToken(token, process.env.AUTH_SECRET as string);
}

export async function assertApiAuth(req: NextRequest): Promise<boolean> {
  const apiKey = process.env.API_SECRET_KEY;
  if (apiKey && req.headers.get('x-api-key') === apiKey) return true;
  return hasValidSession(req);
}
