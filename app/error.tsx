'use client';
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-heading-lg font-semibold text-danger mb-2">Something went wrong</h1>
        <p className="text-body-md text-text-secondary mb-6">{error.message}</p>
        <button onClick={reset} className="px-4 py-2 bg-brand text-brand-foreground rounded-lg text-body-sm">
          Try again
        </button>
      </div>
    </div>
  );
}
