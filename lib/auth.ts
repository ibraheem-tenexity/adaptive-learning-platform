import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export interface Session {
  userId: string;
  email: string;
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('session');
  if (!session) return null;
  try {
    return JSON.parse(Buffer.from(session.value, 'base64').toString('utf8')) as Session;
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect('/auth/login');
  return session;
}
