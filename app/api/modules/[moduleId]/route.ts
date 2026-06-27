import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getDb } from '@/lib/db/client';
import { modules, resources, checks, skills } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  await requireSession();
  const { moduleId } = await params;
  const db = getDb();

  const [mod] = await db
    .select({
      id: modules.id, title: modules.title, objective: modules.objective,
      estMinutes: modules.estMinutes, status: modules.status,
      skillName: skills.name,
    })
    .from(modules)
    .innerJoin(skills, eq(modules.skillId, skills.id))
    .where(eq(modules.id, moduleId))
    .limit(1);

  if (!mod) return NextResponse.json({ error: 'Module not found' }, { status: 404 });

  const moduleResources = await db.select({
    id: resources.id, title: resources.title, type: resources.type,
    urlOrDescription: resources.urlOrDescription, isAiSuggested: resources.isAiSuggested,
  }).from(resources).where(eq(resources.moduleId, moduleId));

  // Get check ID (no items — client fetches those separately when starting the check)
  const [check] = await db.select({ id: checks.id })
    .from(checks).where(eq(checks.moduleId, moduleId)).limit(1);

  return NextResponse.json({
    ...mod,
    resources: moduleResources,
    checkId: check?.id || null,
  });
}
