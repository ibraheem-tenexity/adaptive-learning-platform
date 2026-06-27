import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getDb } from '@/lib/db/client';
import { goals } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generatePathPlan } from '@/lib/planner';
import { persistPathPlan } from '@/lib/skillmap';

export async function POST(req: NextRequest) {
  const session = await requireSession();
  const { goalId } = await req.json();

  if (!goalId) return NextResponse.json({ error: 'goalId required' }, { status: 400 });

  const db = getDb();
  const [goal] = await db.select().from(goals).where(eq(goals.id, goalId)).limit(1);
  if (!goal || goal.userId !== session.userId) {
    return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
  }

  // Generate path plan (mock or real)
  const plan = await generatePathPlan(goal.text, goal.weeklyMinutes, goal.targetLevel);

  // Persist to DB with cycle guard
  const result = await persistPathPlan(goalId, plan, []);

  return NextResponse.json({
    pathId: result.pathId,
    moduleIds: result.moduleIds,
    firstModuleId: result.firstAvailableModuleId,
    skillCount: plan.skills.length,
    moduleCount: plan.modules.length,
  });
}
