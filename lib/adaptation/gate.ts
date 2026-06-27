import { getDb } from '@/lib/db/client';
import { modules, mastery, reviewState, skillEdges, checks, checkItems } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import type { GradeResult } from '@/lib/zod/check';

export type GateOutcome = 'PASS' | 'PARTIAL' | 'FAIL';

export interface GateResult {
  outcome: GateOutcome;
  moduleId: string;
  skillId: string;
  missedConceptTags: string[];
  shouldReplan: boolean;
}

/**
 * Process a gate result after grading.
 * PASS → mark skill mastered, init review_state, run unlock pass
 * PARTIAL → keep in_progress, return missed concept tags for re-check
 * FAIL → emit GATE_FAIL signal (shouldReplan=true)
 */
export async function processGateResult(
  moduleId: string,
  userId: string,
  gradeResult: GradeResult,
): Promise<GateResult> {
  const db = getDb();

  const [mod] = await db.select({ skillId: modules.skillId, pathId: modules.pathId })
    .from(modules)
    .where(eq(modules.id, moduleId))
    .limit(1);

  if (!mod) throw new Error(`Module ${moduleId} not found`);

  if (gradeResult.verdict === 'PASS') {
    // Mark skill mastered
    await db.insert(mastery).values({
      userId,
      skillId: mod.skillId,
      masteredBool: true,
      score: gradeResult.score,
    }).onConflictDoUpdate({
      target: [mastery.userId, mastery.skillId],
      set: { masteredBool: true, score: gradeResult.score, ts: new Date() },
    });

    // Update module status to mastered
    await db.update(modules)
      .set({ status: 'mastered' })
      .where(eq(modules.id, moduleId));

    // Initialize review_state (Leitner box 1: due in 1 day)
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + 1);
    await db.insert(reviewState).values({
      userId,
      skillId: mod.skillId,
      difficulty: 0.3,
      stability: 1.0,
      retrievability: 1.0,
      dueAt,
    }).onConflictDoUpdate({
      target: [reviewState.userId, reviewState.skillId],
      set: { dueAt, lastReviewedAt: new Date() },
    });

    // Run unlock pass — unlock modules whose prereqs are all mastered
    await runUnlockPass(mod.pathId, userId);

    return { outcome: 'PASS', moduleId, skillId: mod.skillId, missedConceptTags: [], shouldReplan: false };
  }

  if (gradeResult.verdict === 'PARTIAL') {
    // Keep in_progress
    await db.update(modules)
      .set({ status: 'in_progress' })
      .where(eq(modules.id, moduleId));

    return {
      outcome: 'PARTIAL',
      moduleId,
      skillId: mod.skillId,
      missedConceptTags: gradeResult.missedConceptTags,
      shouldReplan: false,
    };
  }

  // FAIL — set stuck, signal replan
  await db.update(modules)
    .set({ status: 'stuck' })
    .where(eq(modules.id, moduleId));

  return {
    outcome: 'FAIL',
    moduleId,
    skillId: mod.skillId,
    missedConceptTags: gradeResult.missedConceptTags,
    shouldReplan: true,
  };
}

/**
 * Unlock pass: for each locked module in the path, check if all prerequisite
 * skills are mastered. If yes, set status to 'available'.
 */
async function runUnlockPass(pathId: string, userId: string): Promise<void> {
  const db = getDb();

  // Get all locked modules in this path with their skills
  const lockedModules = await db
    .select({ id: modules.id, skillId: modules.skillId })
    .from(modules)
    .where(and(eq(modules.pathId, pathId), eq(modules.status, 'locked')));

  for (const mod of lockedModules) {
    // Find all prerequisite skills for this module's skill
    const prereqs = await db
      .select({ prereqSkillId: skillEdges.prereqSkillId })
      .from(skillEdges)
      .where(eq(skillEdges.skillId, mod.skillId));

    if (prereqs.length === 0) {
      // No prereqs — check if there's an in_progress or available module before it
      // (position-based lock: unlock only if previous module is mastered)
      const [modWithPos] = await db.select({ position: modules.position, pathId: modules.pathId })
        .from(modules).where(eq(modules.id, mod.id)).limit(1);

      if (modWithPos.position === 0) {
        await db.update(modules).set({ status: 'available' }).where(eq(modules.id, mod.id));
      }
      continue;
    }

    // Check if ALL prereq skills are mastered by this user
    const prereqIds = prereqs.map(p => p.prereqSkillId);
    const masteredPrereqs = await db
      .select({ skillId: mastery.skillId })
      .from(mastery)
      .where(and(
        eq(mastery.userId, userId),
        eq(mastery.masteredBool, true),
        inArray(mastery.skillId, prereqIds),
      ));

    if (masteredPrereqs.length === prereqIds.length) {
      await db.update(modules).set({ status: 'available' }).where(eq(modules.id, mod.id));
    }
  }
}
