import { requireSession } from '@/lib/auth';
import { getDb } from '@/lib/db/client';
import { goals } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getActivePathForGoal, getModulesForPath } from '@/lib/path';
import { computeWeeklySlice, computeFinishProjection } from '@/lib/slice';
import { getSkillMapForGoal } from '@/lib/skillmap/queries';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const session = await requireSession();
  const db = getDb();

  // Get the user's active goal
  const [goal] = await db.select().from(goals)
    .where(eq(goals.userId, session.userId))
    .orderBy(goals.createdAt)
    .limit(1);

  if (!goal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <h1 className="text-heading-lg font-semibold text-text-primary mb-2">No learning goal yet</h1>
          <p className="text-body-md text-text-secondary mb-6">Set a goal to get your personalized learning path.</p>
          <a href="/onboarding/goal" className="inline-block px-6 py-3 bg-brand text-brand-foreground rounded-lg text-body-md font-medium hover:opacity-90">
            Start learning →
          </a>
        </div>
      </div>
    );
  }

  const path = await getActivePathForGoal(goal.id);

  if (!path) {
    // Path not yet generated — redirect to generating
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-body-md text-text-secondary mb-4">Generating your learning path…</p>
          <a href={`/generating?goalId=${goal.id}`} className="text-brand underline text-body-md">Go to path setup</a>
        </div>
      </div>
    );
  }

  const allModules = await getModulesForPath(path.pathId);
  const weeklySlice = computeWeeklySlice(allModules, goal.weeklyMinutes);
  const projection = computeFinishProjection(allModules, goal.weeklyMinutes, new Date());
  const skillMap = await getSkillMapForGoal(goal.id);

  return (
    <DashboardClient
      goal={{ id: goal.id, text: goal.text, weeklyMinutes: goal.weeklyMinutes }}
      weeklySlice={weeklySlice}
      projection={projection}
      skillMap={skillMap}
      allModules={allModules}
    />
  );
}
