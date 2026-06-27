import { getDb } from '@/lib/db/client';
import { modules } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export type ModuleStatus = 'locked' | 'available' | 'in_progress' | 'mastered' | 'stuck' | 'review';

const VALID_TRANSITIONS: Record<ModuleStatus, ModuleStatus[]> = {
  locked: ['available'],
  available: ['in_progress'],
  in_progress: ['mastered', 'stuck'],
  stuck: ['in_progress'],
  mastered: ['review'],
  review: ['mastered'],
};

export function canTransition(from: ModuleStatus, to: ModuleStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function transitionModule(moduleId: string, to: ModuleStatus): Promise<void> {
  const db = getDb();
  const [mod] = await db.select({ status: modules.status }).from(modules).where(eq(modules.id, moduleId)).limit(1);
  if (!mod) throw new Error(`Module ${moduleId} not found`);

  const from = mod.status as ModuleStatus;
  if (!canTransition(from, to)) {
    throw new Error(`Invalid transition: ${from} → ${to} for module ${moduleId}`);
  }

  await db.update(modules).set({ status: to as any }).where(eq(modules.id, moduleId));
}

export async function startModule(moduleId: string): Promise<void> {
  const db = getDb();
  const [mod] = await db.select({ status: modules.status }).from(modules).where(eq(modules.id, moduleId)).limit(1);
  if (!mod) throw new Error(`Module ${moduleId} not found`);
  if (mod.status === 'available' || mod.status === 'stuck') {
    await db.update(modules).set({ status: 'in_progress' as any }).where(eq(modules.id, moduleId));
  }
}
