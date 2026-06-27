import { requireSession } from '@/lib/auth';
import { getDb } from '@/lib/db/client';
import { goals } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function SettingsPage() {
  const session = await requireSession();
  const db = getDb();
  const [goal] = await db.select().from(goals).where(eq(goals.userId, session.userId)).limit(1);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-heading-lg font-semibold text-text-primary mb-6">Settings</h1>
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <div>
            <span className="text-body-sm font-medium text-text-secondary">Account</span>
            <p className="text-body-md text-text-primary mt-0.5">{session.email}</p>
          </div>
          {goal && (
            <div>
              <span className="text-body-sm font-medium text-text-secondary">Current goal</span>
              <p className="text-body-md text-text-primary mt-0.5">{goal.text}</p>
            </div>
          )}
          <div className="pt-2 border-t border-border-subtle">
            <a href="/api/auth/logout" className="text-body-sm text-danger hover:underline">Sign out</a>
          </div>
        </div>
        <div className="mt-4">
          <a href="/dashboard" className="text-body-sm text-brand hover:underline">← Back to dashboard</a>
        </div>
      </div>
    </div>
  );
}
