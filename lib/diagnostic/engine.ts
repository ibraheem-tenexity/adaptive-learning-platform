import { DIAGNOSTIC_ITEMS } from './items';
import type { DiagnosticItem, DiagnosticState } from '@/lib/zod/diagnostic';

const MIN_ITEMS = 5;
const MAX_ITEMS = 8;

export function selectNextItem(
  state: DiagnosticState,
  answeredIds: string[],
): DiagnosticItem | null {
  if (state.itemsAnswered >= MAX_ITEMS) return null;

  const available = DIAGNOSTIC_ITEMS.filter(item => !answeredIds.includes(item.id));
  if (available.length === 0) return null;

  const targetDifficulty = state.inferredLevel;

  const sorted = available.slice().sort((a, b) =>
    Math.abs(a.difficultyLevel - targetDifficulty) - Math.abs(b.difficultyLevel - targetDifficulty)
  );

  return sorted[0] || null;
}

export function updateState(
  state: DiagnosticState,
  item: DiagnosticItem,
  correct: boolean,
): DiagnosticState {
  const newItemsAnswered = state.itemsAnswered + 1;
  const newCorrectCount = state.correctCount + (correct ? 1 : 0);

  const adjustment = correct ? 0.1 : -0.1;
  const newInferredLevel = Math.max(0, Math.min(1, state.inferredLevel + adjustment));

  const finalInferredLevel = newItemsAnswered > 0
    ? newCorrectCount / newItemsAnswered
    : newInferredLevel;

  return {
    currentLevel: newInferredLevel,
    itemsAnswered: newItemsAnswered,
    correctCount: newCorrectCount,
    inferredLevel: Math.max(0, Math.min(1, (newInferredLevel + finalInferredLevel) / 2)),
  };
}

export function isDiagnosticComplete(state: DiagnosticState, answeredIds: string[]): boolean {
  if (state.itemsAnswered >= MAX_ITEMS) return true;
  if (state.itemsAnswered >= MIN_ITEMS) return true;
  return false;
}
