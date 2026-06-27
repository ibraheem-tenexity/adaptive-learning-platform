import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getDb } from '@/lib/db/client';
import { checks, checkItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  await requireSession();
  const { moduleId } = await params;
  const db = getDb();

  const [check] = await db.select({ id: checks.id, moduleId: checks.moduleId })
    .from(checks)
    .where(eq(checks.moduleId, moduleId))
    .limit(1);

  if (!check) return NextResponse.json({ error: 'No check found' }, { status: 404 });

  // Fetch items WITHOUT answer_key
  const items = await db
    .select({ id: checkItems.id, prompt: checkItems.prompt, conceptTag: checkItems.conceptTag })
    .from(checkItems)
    .where(eq(checkItems.checkId, check.id));

  return NextResponse.json({
    id: check.id,
    moduleId: check.moduleId,
    items, // answer_key intentionally excluded
  });
}
