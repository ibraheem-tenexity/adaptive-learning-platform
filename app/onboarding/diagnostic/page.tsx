'use client';
import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { DiagnosticState } from '@/lib/zod/diagnostic';

interface DiagnosticItemView {
  id: string;
  prompt: string;
  options: { label: string; value: string }[];
  conceptArea: string;
}

function DiagnosticContent() {
  const router = useRouter();
  const params = useSearchParams();
  const goalId = params.get('goalId');

  const [item, setItem] = useState<DiagnosticItemView | null>(null);
  const [state, setState] = useState<DiagnosticState>({ currentLevel: 0.3, itemsAnswered: 0, correctCount: 0, inferredLevel: 0.3 });
  const [answeredIds, setAnsweredIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [totalExpected, setTotalExpected] = useState(5);

  useEffect(() => {
    if (!goalId) return;
    fetch(`/api/diagnostic?goalId=${goalId}`)
      .then(r => r.json())
      .then(data => {
        setItem(data.item);
        setTotalExpected(data.totalExpected || 5);
        setLoading(false);
      });
  }, [goalId]);

  async function handleAnswer() {
    if (!selected || !item || !goalId || submitting) return;
    setSubmitting(true);

    const res = await fetch('/api/diagnostic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-answered-ids': answeredIds.join(','),
      },
      body: JSON.stringify({ goalId, itemId: item.id, response: selected, state }),
    });

    const data = await res.json();
    const newAnsweredIds = [...answeredIds, item.id];
    setAnsweredIds(newAnsweredIds);
    setState(data.newState);
    setSelected(null);
    setSubmitting(false);

    if (data.done || !data.nextItem) {
      router.push(`/generating?goalId=${goalId}`);
    } else {
      setItem(data.nextItem);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-secondary text-body-md">Loading your quick check…</div>
      </div>
    );
  }

  if (!item) return null;

  const progress = state.itemsAnswered / totalExpected;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="category-label">Quick check — Step 2 of 3</span>
            <span className="text-caption text-text-tertiary">{state.itemsAnswered}/{totalExpected}</span>
          </div>
          <div className="h-1.5 bg-sunken rounded-full overflow-hidden">
            <div
              className="h-full bg-brand rounded-full transition-all duration-500"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="text-caption text-text-tertiary mt-2">Helps us skip what you already know</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <p className="text-heading-sm font-medium text-text-primary mb-5">{item.prompt}</p>
          <div className="space-y-3">
            {item.options.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSelected(opt.value)}
                className={`w-full text-left px-4 py-3 rounded-lg border text-body-md transition-all ${
                  selected === opt.value
                    ? 'border-brand bg-brand-soft text-brand-deep font-medium'
                    : 'border-border-default bg-background text-text-primary hover:border-brand hover:bg-brand-soft/30'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleAnswer}
          disabled={!selected || submitting}
          className="mt-4 w-full py-3 px-4 bg-brand text-brand-foreground rounded-lg text-body-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting ? 'Checking…' : state.itemsAnswered >= totalExpected - 1 ? 'Finish & build my path →' : 'Next question →'}
        </button>

        <p className="text-center text-caption text-text-tertiary mt-3">
          This is not a test — it just helps us start at the right place.
        </p>
      </div>
    </div>
  );
}

export default function DiagnosticPage() {
  return (
    <Suspense>
      <DiagnosticContent />
    </Suspense>
  );
}
