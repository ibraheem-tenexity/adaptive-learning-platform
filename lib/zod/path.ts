import { z } from 'zod';

export const ModuleStatusSchema = z.enum(['locked', 'available', 'in_progress', 'mastered', 'stuck', 'review']);
export type ModuleStatus = z.infer<typeof ModuleStatusSchema>;

export const ModuleClientSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  objective: z.string(),
  estMinutes: z.number(),
  status: ModuleStatusSchema,
  skillName: z.string(),
  position: z.number(),
});
export type ModuleClient = z.infer<typeof ModuleClientSchema>;

export const WeeklySliceSchema = z.object({
  modules: z.array(ModuleClientSchema),
  totalMinutes: z.number(),
  nextAction: ModuleClientSchema.nullable(),
});
export type WeeklySlice = z.infer<typeof WeeklySliceSchema>;

export const FinishProjectionSchema = z.object({
  projectedFinishDate: z.string(), // ISO date string
  weeksRemaining: z.number(),
  percentComplete: z.number().min(0).max(100),
  modulesTotal: z.number(),
  modulesComplete: z.number(),
});
export type FinishProjection = z.infer<typeof FinishProjectionSchema>;

export const SkillMapNodeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: z.enum(['locked', 'available', 'in_progress', 'mastered']),
  prereqs: z.array(z.string().uuid()),
});
export type SkillMapNode = z.infer<typeof SkillMapNodeSchema>;
