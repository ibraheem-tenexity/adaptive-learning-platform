import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getDb } from '@/lib/db/client';
import { diagnostics } from '@/lib/db/schema';
import { selectNextItem, updateState, isDiagnosticComplete, DIAGNOSTIC_ITEMS } from '@/lib/diagnostic';
import type { DiagnosticState } from '@/lib/zod/diagnostic';

export async function POST(req: NextRequest) {
  const session = await requireSession();
  const { goalId, itemId, response, state: stateInput } = await req.json();

  const item = DIAGNOSTIC_ITEMS.find(i => i.id === itemId);
  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

  const correct = item.options.find(o => o.value === response)?.isCorrect ?? false;
  const currentState: DiagnosticState = stateInput || {
    currentLevel: 0.3,
    itemsAnswered: 0,
    correctCount: 0,
    inferredLevel: 0.3,
  };

  const db = getDb();
  await db.insert(diagnostics).values({
    userId: session.userId,
    goalId,
    item: item.prompt,
    response,
    correct,
    inferredLevel: currentState.inferredLevel,
  });

  const answeredIds = (req.headers.get('x-answered-ids') || '').split(',').filter(Boolean);
  answeredIds.push(itemId);
  const newState = updateState(currentState, item, correct);

  const done = isDiagnosticComplete(newState, answeredIds);
  const nextItem = done ? null : selectNextItem(newState, answeredIds);

  return NextResponse.json({
    correct,
    newState,
    done,
    nextItem: nextItem ? {
      id: nextItem.id,
      prompt: nextItem.prompt,
      options: nextItem.options.map(o => ({ label: o.label, value: o.value })),
      conceptArea: nextItem.conceptArea,
    } : null,
    inferredLevel: newState.inferredLevel,
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const goalId = searchParams.get('goalId');
  if (!goalId) return NextResponse.json({ error: 'goalId required' }, { status: 400 });

  const initialState: DiagnosticState = {
    currentLevel: 0.3,
    itemsAnswered: 0,
    correctCount: 0,
    inferredLevel: 0.3,
  };

  const firstItem = selectNextItem(initialState, []);
  if (!firstItem) return NextResponse.json({ error: 'No items available' }, { status: 404 });

  return NextResponse.json({
    item: {
      id: firstItem.id,
      prompt: firstItem.prompt,
      options: firstItem.options.map(o => ({ label: o.label, value: o.value })),
      conceptArea: firstItem.conceptArea,
    },
    state: initialState,
    totalExpected: 5,
  });
}
