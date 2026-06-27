import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getDb } from '@/lib/db/client';
import { checkItems, attempts } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';
import { gradeSubmission } from '@/lib/grading';
import { MASTERY_THRESHOLD } from '@/lib/grading/constants';
import { CheckSubmissionSchema } from '@/lib/zod/check';

export async function POST(req: NextRequest) {
  const session = await requireSession();
  const body = await req.json();

  const parsed = CheckSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid submission', details: parsed.error.issues }, { status: 400 });
  }

  const { checkId, responses } = parsed.data;
  const db = getDb();

  const itemIds = responses.map(r => r.checkItemId);
  const items = await db.select().from(checkItems).where(inArray(checkItems.id, itemIds));

  if (items.length !== responses.length) {
    return NextResponse.json({ error: 'Check items not found' }, { status: 404 });
  }

  // Build pairs — answer keys stay server-side
  const pairs = responses.map(r => {
    const item = items.find(i => i.id === r.checkItemId)!;
    return {
      checkItemId: r.checkItemId,
      response: r.response,
      answerKey: item.answerKey,
      conceptTag: item.conceptTag,
    };
  });

  // Grade each item individually for per-item correctness
  const perItemResults = pairs.map(p => ({
    ...p,
    correct: gradeSubmission([p]).score >= MASTERY_THRESHOLD,
  }));

  const result = gradeSubmission(pairs);

  // Persist attempts
  await db.insert(attempts).values(
    perItemResults.map(p => ({
      checkItemId: p.checkItemId,
      userId: session.userId,
      response: p.response,
      correct: p.correct,
    }))
  );

  // Return result — ZERO answer keys in response
  return NextResponse.json({
    score: result.score,
    verdict: result.verdict,
    correctItems: result.correctItems,
    totalItems: result.totalItems,
    missedConceptTags: result.missedConceptTags,
    checkId,
  });
}
