'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface CheckItem {
  id: string;
  prompt: string;
  conceptTag: string;
}

interface CheckData {
  id: string;
  moduleId: string;
  items: CheckItem[];
}

export default function CheckPage() {
  const router = useRouter();
  const params = useParams();
  const checkId = params.checkId as string;

  const [checkData, setCheckData] = useState<CheckData | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<null | {
    verdict: 'PASS' | 'PARTIAL' | 'FAIL';
    score: number;
    correctItems: number;
    totalItems: number;
    missedConceptTags: string[];
    moduleId: string;
    shouldReplan: boolean;
  }>(null);

  useEffect(() => {
    // Fetch check via moduleId from URL or directly
    fetch(`/api/checks/${checkId}`)
      .then(r => r.json())
      .then(data => {
        setCheckData(data);
        setLoading(false);
      });
  }, [checkId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!checkData) return;
    setSubmitting(true);

    const submissionResponses = checkData.items.map(item => ({
      checkItemId: item.id,
      response: responses[item.id] || '',
    }));

    const res = await fetch('/api/gate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkId: checkData.id, responses: submissionResponses }),
    });

    const data = await res.json();
    setResult(data);
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-secondary">Loading check…</div>
      </div>
    );
  }

  if (!checkData) return <div className="p-8 text-danger">Check not found.</div>;

  // Show result screen
  if (result) {
    return <CheckResult result={result} moduleId={checkData.moduleId} checkId={checkId} />;
  }

  const allAnswered = checkData.items.every(item => responses[item.id]?.trim());

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <span className="category-label text-text-tertiary">Mastery check</span>
          <h1 className="text-heading-lg font-semibold text-text-primary mt-1">
            Show what you know
          </h1>
          <p className="text-body-md text-text-secondary mt-1">
            Answer in your own words — we're checking understanding, not exact phrasing.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {checkData.items.map((item, i) => (
            <div key={item.id} className="bg-card rounded-xl border border-border p-5 shadow-xs">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-soft text-brand text-caption font-semibold flex items-center justify-center">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-body-md font-medium text-text-primary mb-3">{item.prompt}</p>
                  <textarea
                    value={responses[item.id] || ''}
                    onChange={e => setResponses(prev => ({ ...prev, [item.id]: e.target.value }))}
                    placeholder="Your answer…"
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-body-md resize-none focus:outline-none focus:ring-2 focus:ring-brand"
                    required
                  />
                  <p className="text-caption text-text-tertiary mt-1">Topic: {item.conceptTag.replace(/-/g, ' ')}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="bg-info-soft rounded-lg px-4 py-3 text-info text-body-sm">
            Need a hint? Go back to the module and re-read — then come back.
          </div>

          <button
            type="submit"
            disabled={!allAnswered || submitting}
            className="w-full py-3 px-4 bg-brand text-brand-foreground rounded-lg text-body-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? 'Checking your answers…' : 'Submit answers'}
          </button>
        </form>
      </div>
    </div>
  );
}

function CheckResult({ result, moduleId, checkId }: {
  result: { verdict: 'PASS' | 'PARTIAL' | 'FAIL'; score: number; correctItems: number; totalItems: number; missedConceptTags: string[]; moduleId: string; shouldReplan: boolean };
  moduleId: string;
  checkId: string;
}) {
  const router = useRouter();

  const config = {
    PASS: {
      icon: '✓',
      heading: 'Mastered',
      sub: 'You demonstrated solid understanding. On to the next challenge.',
      color: 'text-success',
      bg: 'bg-success-soft',
      borderColor: 'border-success',
      cta: 'Continue →',
      ctaAction: () => router.push('/dashboard'),
    },
    PARTIAL: {
      icon: '◑',
      heading: 'Almost — one concept to firm up',
      sub: 'You got most of it. Review the concepts below and try again.',
      color: 'text-warning',
      bg: 'bg-warning-soft',
      borderColor: 'border-warning',
      cta: 'Review & retry',
      ctaAction: () => router.push(`/modules/${moduleId}`),
    },
    FAIL: {
      icon: '○',
      heading: "Let's build a foundation first",
      sub: "We'll add a quick prerequisite to make this click. No worries — this is exactly how learning works.",
      color: 'text-info',
      bg: 'bg-info-soft',
      borderColor: 'border-info',
      cta: result.shouldReplan ? 'Adjust my path' : 'Back to module',
      ctaAction: async () => {
        if (result.shouldReplan) {
          await fetch('/api/replan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ moduleId, trigger: 'GATE_FAIL', reasonText: 'Failed mastery check' }),
          });
          router.push('/dashboard?replan=true');
        } else {
          router.push(`/modules/${moduleId}`);
        }
      },
    },
  };

  const c = config[result.verdict];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className={`rounded-2xl border ${c.borderColor} ${c.bg} p-8 text-center`}>
          <div className={`text-4xl font-bold mb-3 ${c.color}`}>{c.icon}</div>
          <h1 className={`text-heading-lg font-semibold mb-2 ${c.color}`}>{c.heading}</h1>
          <p className="text-body-md text-text-secondary mb-4">{c.sub}</p>

          <div className="bg-card rounded-lg p-3 mb-5 inline-block">
            <p className="text-body-sm text-text-secondary">
              <span className="font-semibold text-text-primary">{result.correctItems}/{result.totalItems}</span> correct
              {' · '}
              <span className="font-semibold text-text-primary">{Math.round(result.score * 100)}%</span>
            </p>
          </div>

          {result.missedConceptTags.length > 0 && (
            <div className="text-left mb-5">
              <p className="text-body-sm font-medium text-text-primary mb-2">Concepts to review:</p>
              <ul className="space-y-1">
                {result.missedConceptTags.map(tag => (
                  <li key={tag} className="text-body-sm text-text-secondary flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0" />
                    {tag.replace(/-/g, ' ')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={c.ctaAction}
            className="w-full py-3 px-4 bg-brand text-brand-foreground rounded-lg text-body-md font-medium hover:opacity-90 transition-opacity"
          >
            {c.cta}
          </button>
        </div>
      </div>
    </div>
  );
}
