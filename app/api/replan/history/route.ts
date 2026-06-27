import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getDb } from '@/lib/db/client';
import { replanEvents, paths } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await requireSession();
  const { searchParams } = new URL(req.url);
  const pathId = searchParams.get('pathId');
  if (!pathId) return NextResponse.json({ error: 'pathId required' }, { status: 400 });

  const db = getDb();
  const events = await db.select({
    id: replanEvents.id,
    trigger: replanEvents.trigger,
    reasonText: replanEvents.reasonText,
    ts: replanEvents.ts,
  }).from(replanEvents).where(eq(replanEvents.pathId, pathId));

  // Human-readable summaries
  const history = events.map(e => ({
    id: e.id,
    ts: e.ts,
    summary: formatReplanSummary(e.trigger, e.reasonText),
  }));

  return NextResponse.json({ history });
}

function formatReplanSummary(trigger: string, reasonText: string | null): string {
  if (trigger === 'GATE_FAIL') {
    return `Added a foundation module to help you build up to this concept. ${reasonText || ''}`.trim();
  }
  if (trigger === 'STUCK_WINDOW') {
    return `Split a module into smaller steps to make progress easier. ${reasonText || ''}`.trim();
  }
  return reasonText || 'Path adjusted based on your progress.';
}
