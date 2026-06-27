import { getDb } from '@/lib/db/client';
import { skills, skillEdges, paths, modules, resources, checks, checkItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hasCycle, topologicalSort } from './cycle';
import type { PathPlan } from '@/lib/zod/planner';

export interface PersistedPath {
  pathId: string;
  moduleIds: string[];
  firstAvailableModuleId: string | null;
}

/**
 * Persist a PathPlan to the database.
 * 1. Validate DAG (no cycles)
 * 2. Insert skills + skill_edges
 * 3. Insert path + modules (topologically ordered)
 * 4. Insert resources + checks + check_items
 * 5. Set first module as 'available', rest as 'locked'
 * Returns the created pathId + module IDs.
 */
export async function persistPathPlan(
  goalId: string,
  plan: PathPlan,
  existingMasteredSkillNames: string[] = [],
): Promise<PersistedPath> {
  const db = getDb();

  // Build edges for cycle detection
  const skillNames = plan.skills.map(s => s.name);
  const edges = plan.skills.flatMap(s =>
    s.prereqs.map(prereq => ({ from: prereq, to: s.name }))
  );

  // Cycle guard
  if (hasCycle(skillNames, edges)) {
    throw new Error('Planner output contains a cycle in the skill DAG');
  }

  // Topological order
  const ordered = topologicalSort(skillNames, edges);

  // Insert skills
  const insertedSkills: Array<{ id: string; name: string }> = [];
  for (const name of ordered) {
    const skillDef = plan.skills.find(s => s.name === name)!;
    const [inserted] = await db.insert(skills).values({
      goalId,
      name: skillDef.name,
      objective: skillDef.objective,
      difficultySeed: skillDef.difficultySeed,
      position: ordered.indexOf(name),
    }).returning({ id: skills.id, name: skills.name });
    insertedSkills.push(inserted);
  }

  const skillIdByName = new Map(insertedSkills.map(s => [s.name, s.id]));

  // Insert skill edges
  for (const skill of plan.skills) {
    for (const prereqName of skill.prereqs) {
      const prereqId = skillIdByName.get(prereqName);
      const skillId = skillIdByName.get(skill.name);
      if (prereqId && skillId) {
        await db.insert(skillEdges).values({ goalId, prereqSkillId: prereqId, skillId }).onConflictDoNothing();
      }
    }
  }

  // Create path
  const [path] = await db.insert(paths).values({ goalId, version: 1, status: 'active' }).returning({ id: paths.id });

  // Insert modules in topological order
  const insertedModules: Array<{ id: string; skillName: string; position: number }> = [];
  for (let i = 0; i < ordered.length; i++) {
    const name = ordered[i];
    const moduleDef = plan.modules.find(m => m.skillName === name);
    if (!moduleDef) continue;

    const skillId = skillIdByName.get(name)!;
    const isPremastered = existingMasteredSkillNames.includes(name);
    const status = isPremastered ? 'mastered' : (i === 0 ? 'available' : 'locked');

    const [mod] = await db.insert(modules).values({
      pathId: path.id,
      skillId,
      position: i,
      title: moduleDef.title,
      objective: moduleDef.objective,
      estMinutes: moduleDef.estMinutes,
      status: status as any,
    }).returning({ id: modules.id });

    insertedModules.push({ id: mod.id, skillName: name, position: i });

    // Insert resources
    for (const res of moduleDef.resources) {
      await db.insert(resources).values({
        moduleId: mod.id,
        title: res.title,
        type: res.type,
        urlOrDescription: res.whatToStudy,
        isAiSuggested: res.isAiSuggested,
      });
    }

    // Insert check
    const [check] = await db.insert(checks).values({ moduleId: mod.id, kind: 'mastery' }).returning({ id: checks.id });
    for (const item of moduleDef.check.items) {
      await db.insert(checkItems).values({
        checkId: check.id,
        prompt: item.prompt,
        answerKey: item.answerKey,
        conceptTag: item.conceptTag,
      });
    }
  }

  // Find first non-mastered module
  const nonMastered = insertedModules.filter(m => !existingMasteredSkillNames.includes(m.skillName));
  const firstAvailableModuleId = nonMastered.length > 0 ? nonMastered[0].id : null;

  return { pathId: path.id, moduleIds: insertedModules.map(m => m.id), firstAvailableModuleId };
}
