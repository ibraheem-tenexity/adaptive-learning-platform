'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GoalPage() {
  const router = useRouter();
  const [goalText, setGoalText] = useState('');
  const [targetLevel, setTargetLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [weeklyMinutes, setWeeklyMinutes] = useState(120);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalText, targetLevel, weeklyMinutes }),
    });
    if (res.ok) {
      const { goalId } = await res.json();
      router.push(`/onboarding/diagnostic?goalId=${goalId}`);
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to save goal');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <span className="category-label">Step 1 of 3</span>
          <h1 className="text-display-md font-semibold text-text-primary mt-2">What do you want to learn?</h1>
          <p className="text-body-lg text-text-secondary mt-2">Be specific — the more detail, the better your personalized path.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-body-sm font-medium text-text-primary mb-2">Your learning goal</label>
            <textarea
              data-testid="goal-input"
              value={goalText}
              onChange={e => setGoalText(e.target.value)}
              placeholder="e.g. Learn React from scratch and build my first web app"
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-body-md resize-none focus:outline-none focus:ring-2 focus:ring-brand"
              required
              minLength={10}
            />
          </div>

          <div>
            <label className="block text-body-sm font-medium text-text-primary mb-2">Your current level</label>
            <div className="grid grid-cols-3 gap-3">
              {(['beginner', 'intermediate', 'advanced'] as const).map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setTargetLevel(level)}
                  className={`py-3 px-4 rounded-lg border text-body-sm font-medium capitalize transition-all ${
                    targetLevel === level
                      ? 'border-brand bg-brand-soft text-brand-deep'
                      : 'border-border-default bg-background text-text-secondary hover:border-brand'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-body-sm font-medium text-text-primary mb-2">
              Weekly time budget: <span className="text-brand font-semibold">{weeklyMinutes} min</span>
            </label>
            <input
              data-testid="weekly-minutes"
              type="range"
              min={30}
              max={600}
              step={30}
              value={weeklyMinutes}
              onChange={e => setWeeklyMinutes(Number(e.target.value))}
              className="w-full accent-brand"
            />
            <div className="flex justify-between text-caption text-text-tertiary mt-1">
              <span>30 min</span>
              <span>10 hrs</span>
            </div>
          </div>

          {error && <p className="text-danger text-body-sm">{error}</p>}

          <button
            data-testid="start-diagnostic"
            type="submit"
            disabled={loading || goalText.length < 10}
            className="w-full py-3 px-4 bg-brand text-brand-foreground rounded-lg text-body-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Continue to quick check →'}
          </button>
        </form>
      </div>
    </div>
  );
}
