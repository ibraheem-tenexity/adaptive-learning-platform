'use client';
import { useRouter } from 'next/navigation';
import type { WeeklySlice, FinishProjection, ModuleClient, SkillMapNode } from '@/lib/zod/path';

interface Props {
  goal: { id: string; text: string; weeklyMinutes: number };
  weeklySlice: WeeklySlice;
  projection: FinishProjection;
  skillMap: SkillMapNode[];
  allModules: ModuleClient[];
}

const STATUS_CONFIG = {
  mastered: { label: 'Mastered', pill: 'bg-success-soft text-success border-success/30' },
  in_progress: { label: 'In progress', pill: 'bg-brand-soft text-brand border-brand/30' },
  available: { label: 'Up next', pill: 'bg-info-soft text-info border-info/30' },
  locked: { label: 'Locked', pill: 'bg-sunken text-text-tertiary border-border' },
  stuck: { label: 'Needs review', pill: 'bg-warning-soft text-warning border-warning/30' },
  review: { label: 'Review due', pill: 'bg-brand-soft text-brand border-brand/30' },
};

function StatusPill({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.locked;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-caption font-medium border ${c.pill}`}>
      {c.label}
    </span>
  );
}

export default function DashboardClient({ goal, weeklySlice, projection, skillMap, allModules }: Props) {
  const router = useRouter();

  const nextAction = weeklySlice.nextAction;
  const noWork = !nextAction && projection.percentComplete === 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* Goal header */}
        <div>
          <span className="category-label">Your goal</span>
          <h1 className="text-heading-lg font-semibold text-text-primary mt-1 leading-snug">{goal.text}</h1>
        </div>

        {/* Hero: today's next action */}
        {noWork ? (
          <div className="bg-success-soft border border-success/30 rounded-2xl p-6 text-center">
            <div className="text-3xl mb-2">🎉</div>
            <h2 className="text-heading-md font-semibold text-success">Goal complete!</h2>
            <p className="text-body-md text-text-secondary mt-1">You&apos;ve mastered all modules. Outstanding work.</p>
          </div>
        ) : nextAction ? (
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="bg-brand px-6 py-3">
              <span className="text-brand-foreground text-caption font-medium uppercase tracking-wider">Today&apos;s next step</span>
            </div>
            <div className="p-6">
              <h2 className="text-heading-md font-semibold text-text-primary mb-1">{nextAction.title}</h2>
              <p className="text-body-md text-text-secondary mb-1">{nextAction.objective}</p>
              <p className="text-caption text-text-tertiary mb-5">~{nextAction.estMinutes} min</p>
              <button
                data-testid="next-action"
                onClick={() => router.push(`/modules/${nextAction.id}`)}
                className="px-6 py-3 bg-brand text-brand-foreground rounded-lg text-body-md font-medium hover:opacity-90 transition-opacity"
              >
                Begin module →
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border p-6 text-center text-text-secondary">
            No modules available right now.{' '}
            <a href="/onboarding/goal" className="text-brand underline">Start a new goal</a>
          </div>
        )}

        {/* Progress stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <div className="text-display-md font-semibold text-brand tabular">{projection.percentComplete}%</div>
            <div className="text-caption text-text-tertiary mt-1">Complete</div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <div className="text-display-md font-semibold text-text-primary tabular">
              {projection.modulesComplete}/{projection.modulesTotal}
            </div>
            <div className="text-caption text-text-tertiary mt-1">Modules</div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <div className="text-heading-sm font-semibold text-text-primary">{projection.projectedFinishDate}</div>
            <div className="text-caption text-text-tertiary mt-1">Est. finish</div>
          </div>
        </div>

        {/* Skill map mastery view */}
        <div>
          <h2 className="text-heading-sm font-semibold text-text-primary mb-3">Skill map</h2>
          <div className="space-y-2">
            {skillMap.map(skill => (
              <div key={skill.id} className="flex items-center justify-between bg-card rounded-lg border border-border px-4 py-3">
                <div>
                  <span className="text-body-md font-medium text-text-primary">{skill.name}</span>
                  {skill.prereqs.length > 0 && (
                    <span className="text-caption text-text-tertiary ml-2">
                      needs: {skill.prereqs.length} prereq{skill.prereqs.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <StatusPill status={skill.status as keyof typeof STATUS_CONFIG} />
              </div>
            ))}
          </div>
        </div>

        {/* This week's slice */}
        {weeklySlice.modules.length > 1 && (
          <div>
            <h2 className="text-heading-sm font-semibold text-text-primary mb-3">
              This week <span className="text-text-tertiary font-normal text-body-sm">· {weeklySlice.totalMinutes} min planned</span>
            </h2>
            <div className="space-y-2">
              {weeklySlice.modules.map(mod => (
                <button
                  key={mod.id}
                  onClick={() => router.push(`/modules/${mod.id}`)}
                  className="w-full flex items-center justify-between bg-card rounded-lg border border-border px-4 py-3 hover:border-brand transition-colors text-left"
                >
                  <div>
                    <span className="text-body-md text-text-primary">{mod.title}</span>
                    <span className="text-caption text-text-tertiary ml-2">~{mod.estMinutes} min</span>
                  </div>
                  <StatusPill status={mod.status as keyof typeof STATUS_CONFIG} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Review queue stub (P2) */}
        <div className="bg-sunken rounded-xl border border-border-subtle p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-body-sm font-medium text-text-secondary">Due for review</span>
            <span className="text-caption text-text-tertiary">(coming in v2)</span>
          </div>
          <p className="text-caption text-text-tertiary">Spaced repetition reviews will appear here once you&apos;ve mastered your first skills.</p>
        </div>

      </div>
    </div>
  );
}
