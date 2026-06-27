'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Resource {
  id: string;
  title: string;
  type: string;
  urlOrDescription: string;
  isAiSuggested: boolean;
}

interface ModuleDetail {
  id: string;
  title: string;
  objective: string;
  estMinutes: number;
  status: string;
  skillName: string;
  resources: Resource[];
  checkId: string | null;
}

const TYPE_ICONS: Record<string, string> = {
  video: '▶',
  article: '◈',
  exercise: '⊙',
  book: '◳',
  tool: '⚙',
  other: '◉',
};

export default function ModuleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = params.moduleId as string;

  const [module, setModule] = useState<ModuleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetch(`/api/modules/${moduleId}`)
      .then(r => r.json())
      .then(data => { setModule(data); setLoading(false); });
  }, [moduleId]);

  async function handleStartCheck() {
    if (!module?.checkId) return;
    setStarting(true);

    // Transition to in_progress first
    await fetch(`/api/modules/${moduleId}/start`, { method: 'POST' });

    router.push(`/checks/${module.checkId}`);
  }

  async function handleMarkStuck() {
    await fetch(`/api/modules/${moduleId}/start`, { method: 'POST' }); // ensure in_progress
    // V1: just mark stuck via state transition (P2 captures reason text)
    router.push(`/dashboard?stuck=${moduleId}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-secondary text-body-md">Loading module…</div>
      </div>
    );
  }

  if (!module) return <div className="p-8 text-danger">Module not found.</div>;

  const canStartCheck = module.status === 'available' || module.status === 'in_progress' || module.status === 'stuck';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Back nav */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 text-body-sm text-text-secondary hover:text-brand transition-colors mb-6"
        >
          ← Dashboard
        </button>

        {/* Module header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="category-label">{module.skillName}</span>
            <span className="text-text-tertiary text-caption">·</span>
            <span className="text-caption text-text-tertiary">~{module.estMinutes} min</span>
          </div>
          <h1 className="text-heading-lg font-semibold text-text-primary mb-2">{module.title}</h1>
          <p className="text-body-lg text-text-secondary">{module.objective}</p>
        </div>

        {/* Resources */}
        <div className="mb-8">
          <h2 className="text-heading-sm font-semibold text-text-primary mb-4">What to study</h2>
          <div className="space-y-3">
            {module.resources.map(res => (
              <div key={res.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-soft text-brand flex items-center justify-center text-body-sm">
                    {TYPE_ICONS[res.type] || '◉'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-body-md font-medium text-text-primary">{res.title}</span>
                      <span className="text-caption text-text-tertiary capitalize">{res.type}</span>
                    </div>
                    <p className="text-body-sm text-text-secondary">{res.urlOrDescription}</p>
                    {res.isAiSuggested && (
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-soft border border-brand/20 text-caption text-brand">
                        <span>✦</span>
                        <span>AI-suggested · verify this resource</span>
                      </div>
                    )}
                    {res.isAiSuggested && !res.urlOrDescription.startsWith('http') && (
                      <p className="text-caption text-text-tertiary mt-1">Search for this topic to find current resources.</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Check CTA */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="text-heading-sm font-semibold text-text-primary mb-1">Ready to test your understanding?</h2>
          <p className="text-body-md text-text-secondary mb-4">
            The mastery check is 3–6 short questions. Pass to unlock the next module.
          </p>

          {canStartCheck ? (
            <div className="space-y-3">
              <button
                data-testid="enter-check"
                onClick={handleStartCheck}
                disabled={starting || !module.checkId}
                className="w-full py-3 px-4 bg-brand text-brand-foreground rounded-lg text-body-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {starting ? 'Starting…' : 'Take mastery check →'}
              </button>

              <button
                onClick={handleMarkStuck}
                className="w-full py-2.5 px-4 bg-background border border-border-default text-text-secondary rounded-lg text-body-sm hover:border-brand hover:text-brand transition-colors"
              >
                I'm stuck on this module
              </button>
            </div>
          ) : module.status === 'mastered' ? (
            <div className="text-center py-2">
              <span className="text-success font-medium text-body-md">✓ Mastered</span>
              <p className="text-body-sm text-text-secondary mt-1">This module is complete.</p>
            </div>
          ) : (
            <p className="text-body-sm text-text-tertiary">This module is locked. Complete prerequisites first.</p>
          )}
        </div>

      </div>
    </div>
  );
}
