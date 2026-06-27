'use client';
import { useRouter } from 'next/navigation';

export default function CheckPassPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-full bg-success-soft border-2 border-success flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl text-success font-bold">✓</span>
        </div>
        <h1 className="text-heading-lg font-semibold text-success mb-2">Mastered</h1>
        <p className="text-body-lg text-text-secondary mb-8">You demonstrated solid understanding of this topic.</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full py-3 px-4 bg-brand text-brand-foreground rounded-lg text-body-md font-medium hover:opacity-90"
        >
          Continue learning →
        </button>
      </div>
    </div>
  );
}
