import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getDb } from '@/lib/db/client';
import { checks, checkItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: { checkId: string } }
) {
  await requireSession();
  const db = getDb();

  const [check] = await db.select({ id: checks.id, moduleId: checks.moduleId })
    .from(checks).where(eq(checks.id, params.checkId)).limit(1);

  if (!check) return NextResponse.json({ error: 'Check not found' }, { status: 404 });

  // Items WITHOUT answer_key
  const items = await db
    .select({ id: checkItems.id, prompt: checkItems.prompt, conceptTag: checkItems.conceptTag })
    .from(checkItems).where(eq(checkItems.checkId, check.id));

  return NextResponse.json({ id: check.id, moduleId: check.moduleId, items });
}
