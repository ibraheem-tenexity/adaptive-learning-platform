import { getDb } from '@/lib/db/client';
import { modules, skills, skillEdges, replanEvents, checks, checkItems, resources, paths } from '@/lib/db/schema';
import { eq, and, ne, inArray } from 'drizzle-orm';
import { generatePathPlan } from '@/lib/planner';
import { hasCycle } from '@/lib/skillmap/cycle';
import type { PathPlan } from '@/lib/zod/planner';

export type ReplanTrigger = 'GATE_FAIL' | 'STUCK_WINDOW' | 'MANUAL';

export interface ReplanRequest {
  pathId: string;
  goalId: string;
  userId: string;
  trigger: ReplanTrigger;
  targetModuleId: string;  // the module that failed/is stuck
  reasonText?: string;
}

export interface ReplanResult {
  success: boolean;
  move: 'INSERT_PREREQUISITE' | 'SPLIT_MODULE' | 'NONE';
  newModuleIds: string[];
  replanEventId: string;
}

/**
 * Main re-plan entry point.
 * - Freezes mastered modules (never touches them)
 * - Applies INSERT_PREREQUISITE on GATE_FAIL
 * - Applies SPLIT_MODULE on STUCK_WINDOW
 * - Writes a replan_events row
 */
export async function executeReplan(req: ReplanRequest): Promise<ReplanResult> {
  const db = getDb();

  // Get current path state (snapshot for before_json)
  const allModules = await db.select({
    id: modules.id, status: modules.status, position: modules.position,
    title: modules.title, skillId: modules.skillId,
  }).from(modules).where(eq(modules.pathId, req.pathId));

  const beforeJson = { modules: allModules };

  // INVARIANT: never touch mastered modules
  const masteredIds = new Set(allModules.filter(m => m.status === 'mastered' || m.status === 'review').map(m => m.id));

  const [targetMod] = await db.select({
    id: modules.id, skillId: modules.skillId, position: modules.position,
    title: modules.title, pathId: modules.pathId,
  }).from(modules).where(eq(modules.id, req.targetModuleId)).limit(1);

  if (!targetMod) throw new Error(`Target module ${req.targetModuleId} not found`);
  if (masteredIds.has(targetMod.id)) throw new Error('Cannot replan a mastered module');

  let move: ReplanResult['move'] = 'NONE';
  let newModuleIds: string[] = [];

  if (req.trigger === 'GATE_FAIL') {
    // INSERT_PREREQUISITE: ask planner to generate a prerequisite skill for the failed skill
    const [targetSkill] = await db.select({ name: skills.name, objective: skills.objective })
      .from(skills).where(eq(skills.id, targetMod.skillId)).limit(1);

    const [goal] = await db.select({ text: skills.objective, weeklyMinutes: modules.estMinutes })
      .from(paths).innerJoin(modules, eq(modules.pathId, paths.id))
      .where(eq(paths.id, req.pathId)).limit(1);

    // Generate a prerequisite module via Planner (mock returns a scripted prerequisite)
    const prereqPlan = await generatePrerequisite(targetSkill.name, targetSkill.objective);

    // Validate no cycle would be introduced
    const existingSkills = await db.select({ id: skills.id, name: skills.name })
      .from(skills).where(eq(skills.goalId, req.goalId));
    const existingEdges = await db.select({ prereqSkillId: skillEdges.prereqSkillId, skillId: skillEdges.skillId })
      .from(skillEdges).where(eq(skillEdges.goalId, req.goalId));

    const allSkillNames = [...existingSkills.map(s => s.name), prereqPlan.name];
    const allEdges = [
      ...existingEdges.map(e => ({
        from: existingSkills.find(s => s.id === e.prereqSkillId)?.name || '',
        to: existingSkills.find(s => s.id === e.skillId)?.name || '',
      })),
      { from: prereqPlan.name, to: targetSkill.name },
    ].filter(e => e.from && e.to);

    if (hasCycle(allSkillNames, allEdges)) {
      // Cycle would be introduced — skip this replan
      const [event] = await db.insert(replanEvents).values({
        pathId: req.pathId,
        trigger: req.trigger,
        reasonText: 'Cycle detected — prerequisite insertion skipped',
        beforeJson,
        afterJson: beforeJson,
      }).returning({ id: replanEvents.id });
      return { success: false, move: 'NONE', newModuleIds: [], replanEventId: event.id };
    }

    // Insert the new prerequisite skill
    const [newSkill] = await db.insert(skills).values({
      goalId: req.goalId,
      name: prereqPlan.name,
      objective: prereqPlan.objective,
      difficultySeed: prereqPlan.difficultySeed,
      position: targetMod.position,
    }).returning({ id: skills.id });

    // Add edge: newSkill → targetSkill
    await db.insert(skillEdges).values({
      goalId: req.goalId,
      prereqSkillId: newSkill.id,
      skillId: targetMod.skillId,
    }).onConflictDoNothing();

    // Shift all non-mastered modules at >= targetMod.position down by 1
    const modsToShift = allModules.filter(m => m.position >= targetMod.position && !masteredIds.has(m.id));
    for (const m of modsToShift) {
      await db.update(modules).set({ position: m.position + 1 }).where(eq(modules.id, m.id));
    }

    // Insert new prerequisite module BEFORE the failed one
    const [newModule] = await db.insert(modules).values({
      pathId: req.pathId,
      skillId: newSkill.id,
      position: targetMod.position,
      title: prereqPlan.moduleTitle,
      objective: prereqPlan.objective,
      estMinutes: prereqPlan.estMinutes,
      status: 'available',
    }).returning({ id: modules.id });

    // Insert resources
    for (const res of prereqPlan.resources) {
      await db.insert(resources).values({
        moduleId: newModule.id,
        title: res.title,
        type: res.type,
        urlOrDescription: res.whatToStudy,
        isAiSuggested: true,
      });
    }

    // Insert check
    const [check] = await db.insert(checks).values({ moduleId: newModule.id, kind: 'mastery' }).returning({ id: checks.id });
    for (const item of prereqPlan.checkItems) {
      await db.insert(checkItems).values({
        checkId: check.id,
        prompt: item.prompt,
        answerKey: item.answerKey,
        conceptTag: item.conceptTag,
      });
    }

    newModuleIds = [newModule.id];
    move = 'INSERT_PREREQUISITE';

  } else if (req.trigger === 'STUCK_WINDOW') {
    // SPLIT_MODULE: split the stuck module into 2 smaller ones
    move = 'SPLIT_MODULE';
    newModuleIds = await splitModule(req.pathId, req.goalId, targetMod, masteredIds);
  }

  // Get after state
  const afterModules = await db.select({ id: modules.id, status: modules.status, position: modules.position }).from(modules).where(eq(modules.pathId, req.pathId));

  const [event] = await db.insert(replanEvents).values({
    pathId: req.pathId,
    trigger: req.trigger,
    reasonText: req.reasonText || `${move} applied to module ${req.targetModuleId}`,
    beforeJson,
    afterJson: { modules: afterModules },
  }).returning({ id: replanEvents.id });

  return { success: true, move, newModuleIds, replanEventId: event.id };
}

// Generate a prerequisite skill/module description (mock-aware)
async function generatePrerequisite(skillName: string, objective: string) {
  // Mock: return a scripted prerequisite for any skill
  return {
    name: `${skillName} — Foundations`,
    objective: `Build the foundational concepts required for: ${objective}`,
    difficultySeed: 0.2,
    estMinutes: 30,
    moduleTitle: `${skillName}: Foundations`,
    resources: [
      { title: `${skillName} prerequisite reading`, type: 'article' as const, whatToStudy: `Core concepts you need before tackling ${skillName}` },
    ],
    checkItems: [
      { prompt: `What is the main goal of ${skillName}?`, answerKey: `understanding and applying ${skillName.toLowerCase()} concepts`, conceptTag: 'foundations' },
      { prompt: `Name one key concept in ${skillName}.`, answerKey: skillName.toLowerCase().split(' ')[0], conceptTag: 'key-concept' },
      { prompt: `Why is ${skillName} important?`, answerKey: `it provides the foundation for more advanced topics`, conceptTag: 'motivation' },
    ],
  };
}

async function splitModule(
  pathId: string,
  goalId: string,
  targetMod: { id: string; skillId: string; position: number; title: string },
  masteredIds: Set<string>,
): Promise<string[]> {
  const db = getDb();

  // Get existing check items to split
  const [existingCheck] = await db.select({ id: checks.id }).from(checks).where(eq(checks.moduleId, targetMod.id)).limit(1);
  const existingItems = existingCheck
    ? await db.select().from(checkItems).where(eq(checkItems.checkId, existingCheck.id))
    : [];

  // Shift modules after target down by 1
  const allMods = await db.select({ id: modules.id, position: modules.position }).from(modules).where(eq(modules.pathId, pathId));
  const modsToShift = allMods.filter(m => m.position > targetMod.position && !masteredIds.has(m.id));
  for (const m of modsToShift) {
    await db.update(modules).set({ position: m.position + 1 }).where(eq(modules.id, m.id));
  }

  // Create a "Part 1" module at same position (split the original)
  await db.update(modules).set({ title: `${targetMod.title} — Part 1`, estMinutes: 20 }).where(eq(modules.id, targetMod.id));

  // Create "Part 2" module at position+1
  const [part2] = await db.insert(modules).values({
    pathId,
    skillId: targetMod.skillId,
    position: targetMod.position + 1,
    title: `${targetMod.title} — Part 2`,
    objective: 'Continue and consolidate the previous concepts',
    estMinutes: 20,
    status: 'locked',
  }).returning({ id: modules.id });

  // Split check items: first half stays in original, second half goes to Part 2
  const half = Math.ceil(existingItems.length / 2);
  const part2Items = existingItems.slice(half);

  if (part2Items.length > 0) {
    const [part2Check] = await db.insert(checks).values({ moduleId: part2.id, kind: 'mastery' }).returning({ id: checks.id });
    for (const item of part2Items) {
      await db.insert(checkItems).values({
        checkId: part2Check.id,
        prompt: item.prompt,
        answerKey: item.answerKey,
        conceptTag: item.conceptTag,
      });
      await db.delete(checkItems).where(eq(checkItems.id, item.id));
    }
  }

  return [targetMod.id, part2.id];
}
