'use client';
import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function GeneratingContent() {
  const router = useRouter();
  const params = useSearchParams();
  const goalId = params.get('goalId');
  const [status, setStatus] = useState<'generating' | 'done' | 'error'>('generating');
  const [skillCount, setSkillCount] = useState(0);
  const [moduleCount, setModuleCount] = useState(0);
  const ranRef = useRef(false);

  useEffect(() => {
    if (!goalId || ranRef.current) return;
    ranRef.current = true;

    async function generate() {
      // First trigger skill-map generation
      const res = await fetch('/api/skillmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId }),
      });
      if (!res.ok) {
        setStatus('error');
        return;
      }
      const data = await res.json();
      setSkillCount(data.skillCount || 0);
      setModuleCount(data.moduleCount || 0);
      setStatus('done');
      setTimeout(() => router.push(`/path-ready?goalId=${goalId}`), 800);
    }

    generate();
  }, [goalId, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 rounded-full bg-brand-soft flex items-center justify-center mx-auto mb-6">
          <div className={`w-6 h-6 rounded-full bg-brand ${status === 'generating' ? 'animate-pulse' : ''}`} />
        </div>
        {status === 'generating' && (
          <>
            <h1 className="text-heading-md font-semibold text-text-primary mb-2">Building your learning path…</h1>
            <p className="text-body-md text-text-secondary">Mapping skills and creating your personalized modules.</p>
            <div className="mt-6 space-y-2">
              {[
                'Analysing your goal',
                'Mapping prerequisite skills',
                'Creating learning modules',
                'Generating mastery checks',
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3 text-left px-4 py-2.5 rounded-lg bg-card border border-border">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand agent-at-work flex-shrink-0" />
                  <span className="text-body-sm text-text-secondary">{step}</span>
                </div>
              ))}
            </div>
          </>
        )}
        {status === 'done' && (
          <>
            <h1 className="text-heading-md font-semibold text-success mb-2">Path ready!</h1>
            <p className="text-body-md text-text-secondary">{skillCount} skills · {moduleCount} modules</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="text-heading-md font-semibold text-danger mb-2">Something went wrong</h1>
            <a href="/onboarding/goal" className="text-brand underline text-body-md">Try again</a>
          </>
        )}
      </div>
    </div>
  );
}

export default function GeneratingPage() {
  return (
    <Suspense>
      <GeneratingContent />
    </Suspense>
  );
}
