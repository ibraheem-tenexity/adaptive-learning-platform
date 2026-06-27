import { requireSession } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await requireSession();
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-heading-lg font-semibold text-text-primary mb-2">Your Learning Dashboard</h1>
        <p className="text-body-md text-text-secondary mb-8">Welcome, {session.email}</p>
        <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
          <p className="text-body-md text-text-secondary">Start a new goal to begin your learning journey.</p>
          <a href="/onboarding/goal" className="mt-4 inline-block px-4 py-2 bg-brand text-brand-foreground rounded-md text-body-md font-medium hover:opacity-90">
            Start learning
          </a>
        </div>
      </div>
    </div>
  );
}
