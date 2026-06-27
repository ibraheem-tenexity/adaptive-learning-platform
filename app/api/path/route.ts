import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getActivePathForGoal, getModulesForPath, getGoalForUser } from '@/lib/path';
import { computeWeeklySlice, computeFinishProjection } from '@/lib/slice';

export async function GET(req: NextRequest) {
  const session = await requireSession();
  const { searchParams } = new URL(req.url);
  const goalId = searchParams.get('goalId');

  if (!goalId) return NextResponse.json({ error: 'goalId required' }, { status: 400 });

  const goal = await getGoalForUser(goalId, session.userId);
  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });

  const path = await getActivePathForGoal(goalId);
  if (!path) return NextResponse.json({ error: 'No active path' }, { status: 404 });

  const allModules = await getModulesForPath(path.pathId);
  const weeklySlice = computeWeeklySlice(allModules, goal.weeklyMinutes);
  const projection = computeFinishProjection(allModules, goal.weeklyMinutes, new Date());

  return NextResponse.json({
    pathId: path.pathId,
    goalText: goal.text,
    weeklySlice,
    projection,
    allModules,
  });
}
