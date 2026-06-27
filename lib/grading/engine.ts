import { MASTERY_THRESHOLD, PARTIAL_THRESHOLD } from './constants';
import type { GradeResult } from '@/lib/zod/check';

interface AnswerPair {
  checkItemId: string;
  response: string;
  answerKey: string;
  conceptTag: string;
}

/**
 * Normalize a response for comparison.
 * - Lowercase
 * - Trim whitespace
 * - Collapse multiple spaces
 * - Remove trailing punctuation
 */
function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[.!?,;:]+$/, '');
}

/**
 * Check if response contains the key concepts from the answer key.
 * Strategy: check for keyword overlap — response must contain most key terms.
 */
function isCorrect(response: string, answerKey: string): boolean {
  const normResponse = normalize(response);
  const normKey = normalize(answerKey);

  // Exact or substring match
  if (normResponse === normKey || normResponse.includes(normKey) || normKey.includes(normResponse)) {
    return true;
  }

  // Keyword overlap: split on spaces/punctuation, check if response has >=70% of key terms
  const keyTerms = normKey.split(/[\s,;]+/).filter(t => t.length > 3);
  if (keyTerms.length === 0) return normResponse.length > 2;

  const matchCount = keyTerms.filter(term => normResponse.includes(term)).length;
  return matchCount / keyTerms.length >= 0.6;
}

export function gradeSubmission(pairs: AnswerPair[]): GradeResult {
  if (pairs.length === 0) {
    return { score: 0, verdict: 'FAIL', missedConceptTags: [], totalItems: 0, correctItems: 0 };
  }

  const results = pairs.map(pair => ({
    ...pair,
    correct: isCorrect(pair.response, pair.answerKey),
  }));

  const correctItems = results.filter(r => r.correct).length;
  const totalItems = results.length;
  const score = correctItems / totalItems;

  const verdict = score >= MASTERY_THRESHOLD ? 'PASS'
    : score >= PARTIAL_THRESHOLD ? 'PARTIAL'
    : 'FAIL';

  const missedConceptTags = results
    .filter(r => !r.correct)
    .map(r => r.conceptTag);

  return { score, verdict, correctItems, totalItems, missedConceptTags };
}
