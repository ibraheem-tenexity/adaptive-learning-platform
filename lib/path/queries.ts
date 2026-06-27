import { getDb } from '@/lib/db/client';
import { modules, paths, skills, goals } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { ModuleClient } from '@/lib/zod/path';

export async function getActivePathForGoal(goalId: string): Promise<{ pathId: string } | null> {
  const db = getDb();
  const [path] = await db.select({ id: paths.id })
    .from(paths)
    .where(and(eq(paths.goalId, goalId), eq(paths.status, 'active')))
    .orderBy(paths.version)
    .limit(1);
  return path ? { pathId: path.id } : null;
}

export async function getModulesForPath(pathId: string): Promise<ModuleClient[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: modules.id,
      title: modules.title,
      objective: modules.objective,
      estMinutes: modules.estMinutes,
      status: modules.status,
      skillName: skills.name,
      position: modules.position,
    })
    .from(modules)
    .innerJoin(skills, eq(modules.skillId, skills.id))
    .where(eq(modules.pathId, pathId))
    .orderBy(modules.position);

  return rows.map(r => ({
    id: r.id,
    title: r.title,
    objective: r.objective,
    estMinutes: r.estMinutes,
    status: r.status as ModuleClient['status'],
    skillName: r.skillName,
    position: r.position,
  }));
}

export async function getGoalForUser(goalId: string, userId: string) {
  const db = getDb();
  const [goal] = await db.select()
    .from(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    .limit(1);
  return goal || null;
}
