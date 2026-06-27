import { getDb } from '@/lib/db/client';
import { skills, skillEdges, modules, paths } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { SkillMapNode } from '@/lib/zod/path';

export async function getSkillMapForGoal(goalId: string): Promise<SkillMapNode[]> {
  const db = getDb();

  const skillRows = await db.select({ id: skills.id, name: skills.name, position: skills.position })
    .from(skills).where(eq(skills.goalId, goalId)).orderBy(skills.position);

  const edgeRows = await db.select({ prereqSkillId: skillEdges.prereqSkillId, skillId: skillEdges.skillId })
    .from(skillEdges).where(eq(skillEdges.goalId, goalId));

  // Build prereqs map
  const prereqsMap = new Map<string, string[]>();
  for (const edge of edgeRows) {
    const existing = prereqsMap.get(edge.skillId) || [];
    existing.push(edge.prereqSkillId);
    prereqsMap.set(edge.skillId, existing);
  }

  // Get mastery status — we need module status to determine skill status
  // A skill is mastered if any of its associated modules is mastered
  const moduleRows = await db
    .select({ skillId: modules.skillId, status: modules.status })
    .from(modules)
    .innerJoin(paths, eq(modules.pathId, paths.id))
    .where(eq(paths.goalId, goalId));

  const skillStatusMap = new Map<string, 'locked' | 'available' | 'in_progress' | 'mastered'>();
  for (const mod of moduleRows) {
    const existing = skillStatusMap.get(mod.skillId);
    if (mod.status === 'mastered' || mod.status === 'review') {
      skillStatusMap.set(mod.skillId, 'mastered');
    } else if (mod.status === 'in_progress' || mod.status === 'stuck') {
      if (existing !== 'mastered') skillStatusMap.set(mod.skillId, 'in_progress');
    } else if (mod.status === 'available') {
      if (!existing) skillStatusMap.set(mod.skillId, 'available');
    } else {
      if (!existing) skillStatusMap.set(mod.skillId, 'locked');
    }
  }

  return skillRows.map(s => ({
    id: s.id,
    name: s.name,
    status: skillStatusMap.get(s.id) || 'locked',
    prereqs: prereqsMap.get(s.id) || [],
  }));
}
