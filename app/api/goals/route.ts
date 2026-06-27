import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getDb } from '@/lib/db/client';
import { goals } from '@/lib/db/schema';
import { OnboardingFormSchema } from '@/lib/zod/diagnostic';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const session = await requireSession();
  const body = await req.json();

  const parsed = OnboardingFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid form data', details: parsed.error.issues }, { status: 400 });
  }

  const { goalText, targetLevel, weeklyMinutes } = parsed.data;
  const db = getDb();

  const [goal] = await db.insert(goals).values({
    userId: session.userId,
    text: goalText,
    targetLevel,
    weeklyMinutes,
    status: 'active',
  }).returning({ id: goals.id });

  return NextResponse.json({ goalId: goal.id });
}

export async function GET(req: NextRequest) {
  const session = await requireSession();
  const db = getDb();
  const userGoals = await db.select().from(goals).where(eq(goals.userId, session.userId));
  return NextResponse.json({ goals: userGoals });
}
