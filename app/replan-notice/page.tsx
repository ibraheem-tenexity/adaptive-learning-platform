'use client';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ReplanNoticePage() {
  const router = useRouter();
  const params = useSearchParams();
  const reason = params.get('reason') || 'based on your recent progress';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="text-4xl mb-4">🔄</div>
        <h1 className="text-heading-lg font-semibold text-text-primary mb-2">We adjusted your path</h1>
        <p className="text-body-lg text-text-secondary mb-2">
          Added a foundation step {reason}.
        </p>
        <p className="text-body-md text-text-tertiary mb-8">
          Your mastered modules are untouched — we only added new material before the part you found tricky.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-6 py-3 bg-brand text-brand-foreground rounded-lg text-body-md font-medium hover:opacity-90"
        >
          See updated path →
        </button>
      </div>
    </div>
  );
}
