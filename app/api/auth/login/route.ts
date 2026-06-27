import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const session = Buffer.from(JSON.stringify({ userId: user.id, email: user.email })).toString('base64');

  const cookieStore = await cookies();
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  return NextResponse.json({ ok: true });
}
