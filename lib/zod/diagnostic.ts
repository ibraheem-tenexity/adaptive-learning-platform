import { z } from 'zod';

export const DiagnosticItemSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  options: z.array(z.object({
    label: z.string(),
    value: z.string(),
    isCorrect: z.boolean(),
  })),
  conceptArea: z.string(),
  difficultyLevel: z.number().min(0).max(1),
});
export type DiagnosticItem = z.infer<typeof DiagnosticItemSchema>;

export const DiagnosticStateSchema = z.object({
  currentLevel: z.number().min(0).max(1),
  itemsAnswered: z.number(),
  correctCount: z.number(),
  inferredLevel: z.number().min(0).max(1),
});
export type DiagnosticState = z.infer<typeof DiagnosticStateSchema>;

export const OnboardingFormSchema = z.object({
  goalText: z.string().min(10).max(500),
  targetLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  weeklyMinutes: z.number().int().min(30).max(600),
});
export type OnboardingForm = z.infer<typeof OnboardingFormSchema>;
