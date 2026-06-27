'use client';
import { useRouter } from 'next/navigation';
import type { WeeklySlice, FinishProjection, ModuleClient } from '@/lib/zod/path';

interface Goal { id: string; text: string; weeklyMinutes: number; targetLevel: string }

export default function PathReadyClient({ goal, slice, projection, allModules }: {
  goal: Goal; slice: WeeklySlice; projection: FinishProjection; allModules: ModuleClient[];
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🗺</div>
          <h1 className="text-display-md font-semibold text-text-primary mb-2">Your path is ready</h1>
          <p className="text-body-lg text-text-secondary">{projection.modulesTotal} modules · ~{projection.weeksRemaining} weeks at {goal.weeklyMinutes} min/week</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 mb-6 space-y-4">
          <div>
            <span className="category-label">First week</span>
            <div className="mt-2 space-y-2">
              {slice.modules.slice(0, 3).map(mod => (
                <div key={mod.id} className="flex items-center gap-3 py-2 border-b border-border-subtle last:border-0">
                  <div className="w-2 h-2 rounded-full bg-brand flex-shrink-0" />
                  <span className="text-body-md text-text-primary flex-1">{mod.title}</span>
                  <span className="text-caption text-text-tertiary">~{mod.estMinutes}m</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-body-sm text-text-secondary">Estimated completion</span>
            <span className="text-body-sm font-semibold text-text-primary">{projection.projectedFinishDate}</span>
          </div>
        </div>

        <button
          onClick={() => {
            const first = allModules.find(m => m.status === 'available' || m.status === 'in_progress');
            router.push(first ? `/modules/${first.id}` : '/dashboard');
          }}
          className="w-full py-3 px-4 bg-brand text-brand-foreground rounded-lg text-body-md font-medium hover:opacity-90 transition-opacity"
        >
          Begin first module →
        </button>
      </div>
    </div>
  );
}
