import { getPlannerClient, PLANNER_MODEL, MAX_RETRIES } from './client';
import { getMockPathPlan } from './mock';
import { PathPlanSchema, type PathPlan } from '@/lib/zod/planner';

const SYSTEM_PROMPT = `You are an expert learning path designer. Given a learning goal, you design a prerequisite skill map and ordered learning modules.

RULES:
1. Output STRICT JSON matching the schema — no markdown, no explanation
2. Skills must form a valid DAG (no cycles). prereqs[] lists skill names that must come before this skill.
3. Each module must have 3-6 check items with clear answer_key strings
4. Resources describe WHAT TO STUDY (what_to_study field) — url is nullable
5. The modules array must be ordered topologically (no module before its prereqs)
6. Keep it practical: 4-8 skills, each module 30-90 minutes`;

function buildUserPrompt(goal: string, weeklyMinutes: number, level: string): string {
  return `Create a learning path for this goal: "${goal}"
Learner level: ${level}
Weekly time budget: ${weeklyMinutes} minutes

Return a JSON object with this exact shape:
{
  "skills": [
    { "name": "...", "objective": "...", "difficultySeed": 0.5, "position": 0, "prereqs": [] }
  ],
  "modules": [
    {
      "skillName": "...",
      "title": "...",
      "objective": "...",
      "estMinutes": 45,
      "resources": [
        { "title": "...", "type": "article|video|exercise|book|tool|other", "whatToStudy": "...", "url": null, "isAiSuggested": true }
      ],
      "check": {
        "items": [
          { "prompt": "...", "answerKey": "...", "conceptTag": "..." }
        ]
      }
    }
  ]
}`;
}

export async function generatePathPlan(
  goal: string,
  weeklyMinutes: number,
  level: string,
): Promise<PathPlan> {
  // Mock fallback
  if (process.env.OPENROUTER_API_KEY === 'mock' || !process.env.OPENROUTER_API_KEY) {
    return getMockPathPlan();
  }

  const client = getPlannerClient();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model: PLANNER_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(goal, weeklyMinutes, level) },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error('Empty response from planner');

      const parsed = JSON.parse(raw);
      const validated = PathPlanSchema.parse(parsed);
      return validated;
    } catch (err) {
      lastError = err as Error;
      if (attempt < MAX_RETRIES - 1) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  throw new Error(`Planner failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}

// Streaming version — yields partial JSON chunks for SSE
export async function* generatePathPlanStream(
  goal: string,
  weeklyMinutes: number,
  level: string,
): AsyncGenerator<string> {
  if (process.env.OPENROUTER_API_KEY === 'mock' || !process.env.OPENROUTER_API_KEY) {
    // Simulate streaming for mock
    const plan = getMockPathPlan();
    const chunks = JSON.stringify(plan).match(/.{1,100}/g) || [];
    for (const chunk of chunks) {
      yield chunk;
      await new Promise(r => setTimeout(r, 20));
    }
    return;
  }

  const client = getPlannerClient();
  const stream = await client.chat.completions.create({
    model: PLANNER_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(goal, weeklyMinutes, level) },
    ],
    response_format: { type: 'json_object' },
    stream: true,
    temperature: 0.7,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}
