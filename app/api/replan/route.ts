import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getDb } from '@/lib/db/client';
import { modules, paths } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { executeReplan } from '@/lib/replan';

export async function POST(req: NextRequest) {
  const session = await requireSession();
  const { moduleId, trigger, reasonText } = await req.json();

  if (!moduleId || !trigger) {
    return NextResponse.json({ error: 'moduleId and trigger required' }, { status: 400 });
  }

  const db = getDb();
  const [mod] = await db.select({ pathId: modules.pathId }).from(modules).where(eq(modules.id, moduleId)).limit(1);
  if (!mod) return NextResponse.json({ error: 'Module not found' }, { status: 404 });

  const [path] = await db.select({ goalId: paths.goalId }).from(paths).where(eq(paths.id, mod.pathId)).limit(1);
  if (!path) return NextResponse.json({ error: 'Path not found' }, { status: 404 });

  const result = await executeReplan({
    pathId: mod.pathId,
    goalId: path.goalId,
    userId: session.userId,
    trigger,
    targetModuleId: moduleId,
    reasonText,
  });

  return NextResponse.json(result);
}
