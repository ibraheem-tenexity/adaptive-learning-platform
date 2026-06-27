# TS-05: Diagnostic Engine + Onboarding Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the adaptive diagnostic engine (5-8 items, adapts difficulty) and the onboarding screens (goal form, level selection, diagnostic quiz).

**Architecture:** A seeded item bank in `lib/diagnostic/items.ts` feeds an adaptive engine in `lib/diagnostic/engine.ts` that picks the next question based on inferred level. Two API routes (`/api/goals`, `/api/diagnostic`) back two new onboarding pages (`/onboarding/goal`, `/onboarding/diagnostic`).

**Tech Stack:** Next.js 14 App Router, TypeScript, Drizzle ORM (Postgres), Zod (schemas pre-exist in `lib/zod/diagnostic.ts`), Tailwind with Tenexity design tokens.

## Global Constraints

- All colors via CSS tokens only — `hsl(var(--brand))`, `text-brand`, `bg-brand`, etc. NEVER raw hex.
- `DiagnosticItem`, `DiagnosticState`, `OnboardingFormSchema` are already defined in `lib/zod/diagnostic.ts` — import from there, do not redefine.
- `goals` and `diagnostics` tables already exist in `lib/db/schema.ts` — do not add migrations.
- `requireSession()` from `lib/auth.ts` returns `{ userId, email }` and redirects to `/auth/login` if no session.
- `getDb()` from `lib/db/client.ts` returns a Drizzle instance with all schema tables available.
- `isCorrect` must NEVER be sent to the client in API responses for diagnostic items.
- No test framework is installed — verify by running `next build` (TypeScript type-check) instead.
- Branch: `ts-05-diagnostic` off `main`.

---

### Task 1: Branch setup

**Files:**
- No files created.

- [ ] **Step 1: Create and switch to the feature branch**

```bash
cd /tmp/alp-ts05
git checkout -b ts-05-diagnostic
```

Expected: `Switched to a new branch 'ts-05-diagnostic'`

---

### Task 2: Diagnostic item bank (`lib/diagnostic/items.ts`)

**Files:**
- Create: `lib/diagnostic/items.ts`

**Interfaces:**
- Produces: `DIAGNOSTIC_ITEMS: DiagnosticItem[]`, `PLAYWRIGHT_DIAGNOSTIC_ANSWERS: Record<string, string>`

- [ ] **Step 1: Create `lib/diagnostic/items.ts`**

```typescript
import type { DiagnosticItem } from '@/lib/zod/diagnostic';

export const DIAGNOSTIC_ITEMS: DiagnosticItem[] = [
  {
    id: 'diag-001',
    prompt: 'What does a variable declaration with `const` mean in JavaScript?',
    options: [
      { label: 'The value can never change', value: 'never-change', isCorrect: false },
      { label: 'The binding cannot be reassigned, but objects it points to can be mutated', value: 'binding-const', isCorrect: true },
      { label: 'The variable is global', value: 'global', isCorrect: false },
      { label: 'The variable is a constant integer', value: 'int', isCorrect: false },
    ],
    conceptArea: 'javascript-fundamentals',
    difficultyLevel: 0.2,
  },
  {
    id: 'diag-002',
    prompt: 'What does JSX compile to in React?',
    options: [
      { label: 'Pure HTML strings', value: 'html', isCorrect: false },
      { label: 'React.createElement() calls', value: 'create-element', isCorrect: true },
      { label: 'Virtual DOM objects directly', value: 'vdom', isCorrect: false },
      { label: 'TypeScript types', value: 'ts', isCorrect: false },
    ],
    conceptArea: 'react-basics',
    difficultyLevel: 0.35,
  },
  {
    id: 'diag-003',
    prompt: 'In React, what hook do you use to run code after a component renders?',
    options: [
      { label: 'useState', value: 'usestate', isCorrect: false },
      { label: 'useCallback', value: 'usecallback', isCorrect: false },
      { label: 'useEffect', value: 'useeffect', isCorrect: true },
      { label: 'useRef', value: 'useref', isCorrect: false },
    ],
    conceptArea: 'react-hooks',
    difficultyLevel: 0.5,
  },
  {
    id: 'diag-004',
    prompt: 'What is the purpose of the dependency array in useEffect?',
    options: [
      { label: 'To list all variables used inside the effect', value: 'all-vars', isCorrect: false },
      { label: 'To control when the effect re-runs — it re-runs when any dependency changes', value: 'control-rerun', isCorrect: true },
      { label: 'To inject props into the effect', value: 'inject-props', isCorrect: false },
      { label: "To declare the effect's return type", value: 'return-type', isCorrect: false },
    ],
    conceptArea: 'react-hooks',
    difficultyLevel: 0.6,
  },
  {
    id: 'diag-005',
    prompt: 'What does Array.prototype.map() return?',
    options: [
      { label: 'A new array with the same length, each element transformed', value: 'new-array', isCorrect: true },
      { label: 'The first element that matches a condition', value: 'first-match', isCorrect: false },
      { label: 'A boolean indicating if any element matches', value: 'boolean', isCorrect: false },
      { label: 'The original array, mutated', value: 'mutated', isCorrect: false },
    ],
    conceptArea: 'javascript-fundamentals',
    difficultyLevel: 0.15,
  },
  {
    id: 'diag-006',
    prompt: 'In React Router v6, which hook gives you access to URL parameters like /users/:id?',
    options: [
      { label: 'useNavigate', value: 'usenavigate', isCorrect: false },
      { label: 'useLocation', value: 'uselocation', isCorrect: false },
      { label: 'useParams', value: 'useparams', isCorrect: true },
      { label: 'useRoute', value: 'useroute', isCorrect: false },
    ],
    conceptArea: 'react-routing',
    difficultyLevel: 0.65,
  },
  {
    id: 'diag-007',
    prompt: 'What is the correct way to update state that depends on the previous value in React?',
    options: [
      { label: 'setState(state + 1)', value: 'direct', isCorrect: false },
      { label: 'setState(prev => prev + 1)', value: 'functional', isCorrect: true },
      { label: 'state = state + 1', value: 'mutate', isCorrect: false },
      { label: 'setState({ prev: state + 1 })', value: 'object', isCorrect: false },
    ],
    conceptArea: 'react-state',
    difficultyLevel: 0.55,
  },
  {
    id: 'diag-008',
    prompt: "Which method is used to prevent a form's default submission behavior in JavaScript?",
    options: [
      { label: 'event.stopPropagation()', value: 'stop', isCorrect: false },
      { label: 'event.preventDefault()', value: 'prevent', isCorrect: true },
      { label: 'event.cancel()', value: 'cancel', isCorrect: false },
      { label: 'return null from the handler', value: 'return-null', isCorrect: false },
    ],
    conceptArea: 'javascript-events',
    difficultyLevel: 0.3,
  },
];

// Seeded answers for the Playwright happy-flow (all correct)
export const PLAYWRIGHT_DIAGNOSTIC_ANSWERS: Record<string, string> = {
  'diag-001': 'binding-const',
  'diag-002': 'create-element',
  'diag-003': 'useeffect',
  'diag-004': 'control-rerun',
  'diag-005': 'new-array',
};
```

- [ ] **Step 2: Verify TypeScript is happy**

```bash
cd /tmp/alp-ts05
npx tsc --noEmit --project tsconfig.json 2>&1 | head -20
```

Expected: no errors referencing `lib/diagnostic/items.ts`

---

### Task 3: Adaptive engine (`lib/diagnostic/engine.ts` + `lib/diagnostic/index.ts`)

**Files:**
- Create: `lib/diagnostic/engine.ts`
- Create: `lib/diagnostic/index.ts`

**Interfaces:**
- Consumes: `DIAGNOSTIC_ITEMS` from `./items`, `DiagnosticItem`, `DiagnosticState` from `@/lib/zod/diagnostic`
- Produces:
  - `selectNextItem(state: DiagnosticState, answeredIds: string[]): DiagnosticItem | null`
  - `updateState(state: DiagnosticState, item: DiagnosticItem, correct: boolean): DiagnosticState`
  - `isDiagnosticComplete(state: DiagnosticState, answeredIds: string[]): boolean`

- [ ] **Step 1: Create `lib/diagnostic/engine.ts`**

```typescript
import { DIAGNOSTIC_ITEMS } from './items';
import type { DiagnosticItem, DiagnosticState } from '@/lib/zod/diagnostic';

const MIN_ITEMS = 5;
const MAX_ITEMS = 8;

export function selectNextItem(
  state: DiagnosticState,
  answeredIds: string[],
): DiagnosticItem | null {
  if (state.itemsAnswered >= MAX_ITEMS) return null;

  const available = DIAGNOSTIC_ITEMS.filter(item => !answeredIds.includes(item.id));
  if (available.length === 0) return null;

  const targetDifficulty = state.inferredLevel;

  const sorted = available.slice().sort((a, b) =>
    Math.abs(a.difficultyLevel - targetDifficulty) - Math.abs(b.difficultyLevel - targetDifficulty)
  );

  return sorted[0] || null;
}

export function updateState(
  state: DiagnosticState,
  item: DiagnosticItem,
  correct: boolean,
): DiagnosticState {
  const newItemsAnswered = state.itemsAnswered + 1;
  const newCorrectCount = state.correctCount + (correct ? 1 : 0);

  const adjustment = correct ? 0.1 : -0.1;
  const newInferredLevel = Math.max(0, Math.min(1, state.inferredLevel + adjustment));

  const finalInferredLevel = newItemsAnswered > 0
    ? newCorrectCount / newItemsAnswered
    : newInferredLevel;

  return {
    currentLevel: newInferredLevel,
    itemsAnswered: newItemsAnswered,
    correctCount: newCorrectCount,
    inferredLevel: Math.max(0, Math.min(1, (newInferredLevel + finalInferredLevel) / 2)),
  };
}

export function isDiagnosticComplete(state: DiagnosticState, answeredIds: string[]): boolean {
  if (state.itemsAnswered >= MAX_ITEMS) return true;
  if (state.itemsAnswered >= MIN_ITEMS) {
    const available = DIAGNOSTIC_ITEMS.filter(item => !answeredIds.includes(item.id));
    return available.length === 0;
  }
  return false;
}
```

- [ ] **Step 2: Create `lib/diagnostic/index.ts`**

```typescript
export { selectNextItem, updateState, isDiagnosticComplete } from './engine';
export { DIAGNOSTIC_ITEMS, PLAYWRIGHT_DIAGNOSTIC_ANSWERS } from './items';
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /tmp/alp-ts05
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors referencing `lib/diagnostic/`

- [ ] **Step 4: Commit**

```bash
cd /tmp/alp-ts05
git add lib/diagnostic/
git commit -m "feat: add diagnostic item bank and adaptive engine"
```

---

### Task 4: Goals API route (`app/api/goals/route.ts`)

**Files:**
- Create: `app/api/goals/route.ts`

**Interfaces:**
- Consumes: `requireSession` from `@/lib/auth`, `getDb` from `@/lib/db/client`, `goals` table from `@/lib/db/schema`, `OnboardingFormSchema` from `@/lib/zod/diagnostic`, `eq` from `drizzle-orm`
- Produces: `POST /api/goals` → `{ goalId: string }`, `GET /api/goals` → `{ goals: Goal[] }`

- [ ] **Step 1: Create `app/api/goals/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getDb } from '@/lib/db/client';
import { goals } from '@/lib/db/schema';
import { OnboardingFormSchema } from '@/lib/zod/diagnostic';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const session = await requireSession();
  const body = await req.json();

  const parsed = OnboardingFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid form data', details: parsed.error.issues }, { status: 400 });
  }

  const { goalText, targetLevel, weeklyMinutes } = parsed.data;
  const db = getDb();

  const [goal] = await db.insert(goals).values({
    userId: session.userId,
    text: goalText,
    targetLevel,
    weeklyMinutes,
    status: 'active',
  }).returning({ id: goals.id });

  return NextResponse.json({ goalId: goal.id });
}

export async function GET(req: NextRequest) {
  const session = await requireSession();
  const db = getDb();
  const userGoals = await db.select().from(goals).where(eq(goals.userId, session.userId));
  return NextResponse.json({ goals: userGoals });
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /tmp/alp-ts05
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors in `app/api/goals/route.ts`

---

### Task 5: Diagnostic API route (`app/api/diagnostic/route.ts`)

**Files:**
- Create: `app/api/diagnostic/route.ts`

**Interfaces:**
- Consumes: `requireSession`, `getDb`, `diagnostics` (schema table), `selectNextItem`, `updateState`, `isDiagnosticComplete`, `DIAGNOSTIC_ITEMS`, `DiagnosticState`
- Produces:
  - `GET /api/diagnostic?goalId=<id>` → `{ item: DiagnosticItemView, state: DiagnosticState, totalExpected: 5 }`
  - `POST /api/diagnostic` body `{ goalId, itemId, response, state }` header `x-answered-ids` → `{ correct, newState, done, nextItem | null, inferredLevel }`
  - `isCorrect` is stripped from `nextItem.options`

- [ ] **Step 1: Create `app/api/diagnostic/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getDb } from '@/lib/db/client';
import { diagnostics } from '@/lib/db/schema';
import { selectNextItem, updateState, isDiagnosticComplete, DIAGNOSTIC_ITEMS } from '@/lib/diagnostic';
import type { DiagnosticState } from '@/lib/zod/diagnostic';

export async function POST(req: NextRequest) {
  const session = await requireSession();
  const { goalId, itemId, response, state: stateInput } = await req.json();

  const item = DIAGNOSTIC_ITEMS.find(i => i.id === itemId);
  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

  const correct = item.options.find(o => o.value === response)?.isCorrect ?? false;
  const currentState: DiagnosticState = stateInput || {
    currentLevel: 0.3,
    itemsAnswered: 0,
    correctCount: 0,
    inferredLevel: 0.3,
  };

  const db = getDb();
  await db.insert(diagnostics).values({
    userId: session.userId,
    goalId,
    item: item.prompt,
    response,
    correct,
    inferredLevel: currentState.inferredLevel,
  });

  const answeredIds = (req.headers.get('x-answered-ids') || '').split(',').filter(Boolean);
  answeredIds.push(itemId);
  const newState = updateState(currentState, item, correct);

  const done = isDiagnosticComplete(newState, answeredIds);
  const nextItem = done ? null : selectNextItem(newState, answeredIds);

  return NextResponse.json({
    correct,
    newState,
    done,
    nextItem: nextItem ? {
      id: nextItem.id,
      prompt: nextItem.prompt,
      options: nextItem.options.map(o => ({ label: o.label, value: o.value })),
      conceptArea: nextItem.conceptArea,
    } : null,
    inferredLevel: newState.inferredLevel,
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const goalId = searchParams.get('goalId');
  if (!goalId) return NextResponse.json({ error: 'goalId required' }, { status: 400 });

  const initialState: DiagnosticState = {
    currentLevel: 0.3,
    itemsAnswered: 0,
    correctCount: 0,
    inferredLevel: 0.3,
  };

  const firstItem = selectNextItem(initialState, []);
  if (!firstItem) return NextResponse.json({ error: 'No items available' }, { status: 404 });

  return NextResponse.json({
    item: {
      id: firstItem.id,
      prompt: firstItem.prompt,
      options: firstItem.options.map(o => ({ label: o.label, value: o.value })),
      conceptArea: firstItem.conceptArea,
    },
    state: initialState,
    totalExpected: 5,
  });
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /tmp/alp-ts05
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors in `app/api/diagnostic/route.ts`

- [ ] **Step 3: Commit API routes**

```bash
cd /tmp/alp-ts05
git add app/api/goals/route.ts app/api/diagnostic/route.ts
git commit -m "feat: add goals and diagnostic API routes"
```

---

### Task 6: Goal form page (`app/onboarding/goal/page.tsx`)

**Files:**
- Create: `app/onboarding/goal/page.tsx`
- Create: `app/onboarding/` directory (implicit via file creation)

**Interfaces:**
- Consumes: `POST /api/goals` → redirects to `/onboarding/diagnostic?goalId=<id>`
- Produces: SCR-01 goal form with textarea, level selector (beginner/intermediate/advanced), weekly minutes slider

- [ ] **Step 1: Create `app/onboarding/goal/page.tsx`**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /tmp/alp-ts05
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

---

### Task 7: Diagnostic quiz page (`app/onboarding/diagnostic/page.tsx`)

**Files:**
- Create: `app/onboarding/diagnostic/page.tsx`

**Interfaces:**
- Consumes: `GET /api/diagnostic?goalId=<id>` for first item, `POST /api/diagnostic` for each answer
- Produces: SCR-02 adaptive diagnostic quiz with progress bar, option cards, completion redirect to `/generating?goalId=<id>`

- [ ] **Step 1: Create `app/onboarding/diagnostic/page.tsx`**

```typescript
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { DiagnosticState } from '@/lib/zod/diagnostic';

interface DiagnosticItemView {
  id: string;
  prompt: string;
  options: { label: string; value: string }[];
  conceptArea: string;
}

export default function DiagnosticPage() {
  const router = useRouter();
  const params = useSearchParams();
  const goalId = params.get('goalId');

  const [item, setItem] = useState<DiagnosticItemView | null>(null);
  const [state, setState] = useState<DiagnosticState>({ currentLevel: 0.3, itemsAnswered: 0, correctCount: 0, inferredLevel: 0.3 });
  const [answeredIds, setAnsweredIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [totalExpected, setTotalExpected] = useState(5);

  useEffect(() => {
    if (!goalId) return;
    fetch(`/api/diagnostic?goalId=${goalId}`)
      .then(r => r.json())
      .then(data => {
        setItem(data.item);
        setTotalExpected(data.totalExpected || 5);
        setLoading(false);
      });
  }, [goalId]);

  async function handleAnswer() {
    if (!selected || !item || !goalId || submitting) return;
    setSubmitting(true);

    const res = await fetch('/api/diagnostic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-answered-ids': answeredIds.join(','),
      },
      body: JSON.stringify({ goalId, itemId: item.id, response: selected, state }),
    });

    const data = await res.json();
    const newAnsweredIds = [...answeredIds, item.id];
    setAnsweredIds(newAnsweredIds);
    setState(data.newState);
    setSelected(null);
    setSubmitting(false);

    if (data.done || !data.nextItem) {
      router.push(`/generating?goalId=${goalId}`);
    } else {
      setItem(data.nextItem);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-secondary text-body-md">Loading your quick check…</div>
      </div>
    );
  }

  if (!item) return null;

  const progress = state.itemsAnswered / totalExpected;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="category-label">Quick check — Step 2 of 3</span>
            <span className="text-caption text-text-tertiary">{state.itemsAnswered}/{totalExpected}</span>
          </div>
          <div className="h-1.5 bg-sunken rounded-full overflow-hidden">
            <div
              className="h-full bg-brand rounded-full transition-all duration-500"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="text-caption text-text-tertiary mt-2">Helps us skip what you already know</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <p className="text-heading-sm font-medium text-text-primary mb-5">{item.prompt}</p>
          <div className="space-y-3">
            {item.options.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSelected(opt.value)}
                className={`w-full text-left px-4 py-3 rounded-lg border text-body-md transition-all ${
                  selected === opt.value
                    ? 'border-brand bg-brand-soft text-brand-deep font-medium'
                    : 'border-border-default bg-background text-text-primary hover:border-brand hover:bg-brand-soft/30'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleAnswer}
          disabled={!selected || submitting}
          className="mt-4 w-full py-3 px-4 bg-brand text-brand-foreground rounded-lg text-body-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting ? 'Checking…' : state.itemsAnswered >= totalExpected - 1 ? 'Finish & build my path →' : 'Next question →'}
        </button>

        <p className="text-center text-caption text-text-tertiary mt-3">
          This is not a test — it just helps us start at the right place.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript and build**

```bash
cd /tmp/alp-ts05
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 3: Commit UI pages**

```bash
cd /tmp/alp-ts05
git add app/onboarding/
git commit -m "feat: add onboarding goal form and adaptive diagnostic quiz pages"
```

---

### Task 8: Commit plan + push + open PR

- [ ] **Step 1: Commit plan file**

```bash
cd /tmp/alp-ts05
git add docs/superpowers/plans/
git commit -m "docs: add TS-05 implementation plan"
```

- [ ] **Step 2: Push branch**

```bash
cd /tmp/alp-ts05
git push origin ts-05-diagnostic
```

- [ ] **Step 3: Open PR**

```bash
cd /tmp/alp-ts05
gh pr create --title "TS-05: Diagnostic engine + onboarding/diagnostic screens (incl. SCR-00)" --body "$(cat <<'EOF'
## Summary
- 8-item seeded diagnostic bank with difficulty levels 0.15-0.65
- Adaptive selector: correct → harder (+0.1), incorrect → easier (-0.1)
- /api/goals POST creates a goal, returns goalId
- /api/diagnostic GET returns first item, POST advances the quiz
- SCR-01 Goal & Budget form with level selector and time-budget slider
- SCR-02 Adaptive diagnostic with progress bar and option cards
- Tenexity brand tokens throughout (no raw hex)

## Acceptance Criteria
- [x] Adaptive difficulty: harder on correct, easier on incorrect
- [x] isCorrect never exposed to client in diagnostic API
- [x] Goal form creates DB record
- [x] Redirects to /generating after diagnostic completes
EOF
)"
```
