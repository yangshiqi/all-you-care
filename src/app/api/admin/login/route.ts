import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { token } = await req.json().catch(() => ({}));
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return NextResponse.json({ error: 'admin disabled' }, { status: 503 });
  if (token !== expected) return NextResponse.json({ error: 'invalid' }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_token', token, {
    httpOnly: true, secure: true, sameSite: 'strict', path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
