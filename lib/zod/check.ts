import { z } from 'zod';

// What the client receives for a check (no answer key)
export const CheckItemClientSchema = z.object({
  id: z.string().uuid(),
  prompt: z.string(),
  conceptTag: z.string(),
  // NEVER include answerKey here
});
export type CheckItemClient = z.infer<typeof CheckItemClientSchema>;

export const CheckClientSchema = z.object({
  id: z.string().uuid(),
  moduleId: z.string().uuid(),
  items: z.array(CheckItemClientSchema),
});
export type CheckClient = z.infer<typeof CheckClientSchema>;

// Submission from client
export const CheckSubmissionSchema = z.object({
  checkId: z.string().uuid(),
  responses: z.array(z.object({
    checkItemId: z.string().uuid(),
    response: z.string().min(1).max(2000),
  })),
});
export type CheckSubmission = z.infer<typeof CheckSubmissionSchema>;

// Result returned to client (no answer keys)
export const GradeResultSchema = z.object({
  score: z.number().min(0).max(1),
  verdict: z.enum(['PASS', 'PARTIAL', 'FAIL']),
  missedConceptTags: z.array(z.string()),
  totalItems: z.number().int(),
  correctItems: z.number().int(),
});
export type GradeResult = z.infer<typeof GradeResultSchema>;
