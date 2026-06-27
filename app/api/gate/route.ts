import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getDb } from '@/lib/db/client';
import { checkItems, checks, attempts } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { gradeSubmission, MASTERY_THRESHOLD } from '@/lib/grading';
import { processGateResult } from '@/lib/adaptation';
import { CheckSubmissionSchema } from '@/lib/zod/check';

export async function POST(req: NextRequest) {
  const session = await requireSession();
  const body = await req.json();

  const parsed = CheckSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid submission' }, { status: 400 });
  }

  const { checkId, responses } = parsed.data;
  const db = getDb();

  // Get check → module
  const [check] = await db.select({ moduleId: checks.moduleId })
    .from(checks).where(eq(checks.id, checkId)).limit(1);
  if (!check) return NextResponse.json({ error: 'Check not found' }, { status: 404 });

  // Fetch answer keys server-side
  const itemIds = responses.map(r => r.checkItemId);
  const items = await db.select().from(checkItems).where(inArray(checkItems.id, itemIds));

  const pairs = responses.map(r => {
    const item = items.find(i => i.id === r.checkItemId)!;
    return { checkItemId: r.checkItemId, response: r.response, answerKey: item.answerKey, conceptTag: item.conceptTag };
  });

  // Grade each item
  const perItemResults = pairs.map(p => ({
    ...p,
    correct: gradeSubmission([p]).score >= MASTERY_THRESHOLD,
  }));
  const gradeResult = gradeSubmission(pairs);

  // Persist attempts
  await db.insert(attempts).values(
    perItemResults.map(p => ({
      checkItemId: p.checkItemId,
      userId: session.userId,
      response: p.response,
      correct: p.correct,
    }))
  );

  // Run gate
  const gateResult = await processGateResult(check.moduleId, session.userId, gradeResult);

  // Return — zero answer keys
  return NextResponse.json({
    verdict: gradeResult.verdict,
    score: gradeResult.score,
    correctItems: gradeResult.correctItems,
    totalItems: gradeResult.totalItems,
    missedConceptTags: gateResult.missedConceptTags,
    outcome: gateResult.outcome,
    shouldReplan: gateResult.shouldReplan,
    moduleId: gateResult.moduleId,
  });
}
