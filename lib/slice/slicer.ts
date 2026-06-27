import type { ModuleClient, WeeklySlice, FinishProjectionSchema } from '@/lib/zod/path';
import type { FinishProjection } from '@/lib/zod/path';

/**
 * Slice the path into "this week" — modules whose summed est_minutes <= weeklyMinutes.
 * Rules:
 * - Only includes modules with status in ['available', 'in_progress', 'stuck']
 * - Returns exactly ONE highlighted nextAction (first available/in_progress module)
 * - Review items would be injected first (P2); the slot is reserved here
 */
export function computeWeeklySlice(
  allModules: ModuleClient[],
  weeklyMinutes: number,
): WeeklySlice {
  // Available modules (can be worked on this week)
  const workable = allModules.filter(m =>
    m.status === 'available' || m.status === 'in_progress' || m.status === 'stuck'
  );

  let totalMinutes = 0;
  const sliceModules: ModuleClient[] = [];

  for (const mod of workable) {
    if (totalMinutes + mod.estMinutes <= weeklyMinutes) {
      sliceModules.push(mod);
      totalMinutes += mod.estMinutes;
    } else {
      break;
    }
  }

  // If nothing fits (first module exceeds weekly budget), include at least the first one
  if (sliceModules.length === 0 && workable.length > 0) {
    sliceModules.push(workable[0]);
    totalMinutes = workable[0].estMinutes;
  }

  // Next action: first in_progress, then first available
  const nextAction =
    sliceModules.find(m => m.status === 'in_progress') ||
    sliceModules.find(m => m.status === 'available') ||
    sliceModules[0] ||
    null;

  return { modules: sliceModules, totalMinutes, nextAction };
}

/**
 * Project the finish date based on remaining modules and weekly budget.
 */
export function computeFinishProjection(
  allModules: ModuleClient[],
  weeklyMinutes: number,
  startDate: Date,
): FinishProjection {
  const total = allModules.length;
  const completed = allModules.filter(m => m.status === 'mastered' || m.status === 'review').length;
  const percentComplete = total > 0 ? Math.round((completed / total) * 100) : 0;

  const remainingModules = allModules.filter(
    m => m.status !== 'mastered' && m.status !== 'review'
  );
  const remainingMinutes = remainingModules.reduce((sum, m) => sum + m.estMinutes, 0);

  // Weeks remaining = remaining minutes / weekly budget (round up)
  const weeksRemaining = weeklyMinutes > 0
    ? Math.ceil(remainingMinutes / weeklyMinutes)
    : 999;

  const projectedDate = new Date(startDate);
  projectedDate.setDate(projectedDate.getDate() + weeksRemaining * 7);

  return {
    projectedFinishDate: projectedDate.toISOString().split('T')[0],
    weeksRemaining,
    percentComplete,
    modulesTotal: total,
    modulesComplete: completed,
  };
}
