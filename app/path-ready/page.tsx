import { requireSession } from '@/lib/auth';
import { getDb } from '@/lib/db/client';
import { goals } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getActivePathForGoal, getModulesForPath } from '@/lib/path';
import { computeWeeklySlice, computeFinishProjection } from '@/lib/slice';
import PathReadyClient from './PathReadyClient';

export default async function PathReadyPage({ searchParams }: { searchParams: Promise<{ goalId?: string }> }) {
  const session = await requireSession();
  const { goalId } = await searchParams;
  if (!goalId) return <div className="p-8 text-danger">Missing goalId</div>;

  const db = getDb();
  const [goal] = await db.select().from(goals).where(eq(goals.id, goalId)).limit(1);
  if (!goal || goal.userId !== session.userId) return <div className="p-8 text-danger">Goal not found</div>;

  const path = await getActivePathForGoal(goalId);
  if (!path) return <div className="p-8 text-danger">Path not generated yet</div>;

  const allModules = await getModulesForPath(path.pathId);
  const slice = computeWeeklySlice(allModules, goal.weeklyMinutes);
  const projection = computeFinishProjection(allModules, goal.weeklyMinutes, new Date());

  return <PathReadyClient goal={goal} slice={slice} projection={projection} allModules={allModules} />;
}
