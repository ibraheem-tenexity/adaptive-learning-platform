import { z } from 'zod';

// A single skill in the DAG
export const SkillSchema = z.object({
  name: z.string().min(1).max(200),
  objective: z.string().min(1),
  difficultySeed: z.number().min(0).max(1).default(0.5),
  position: z.number().int().min(0).default(0),
  // Names of prerequisite skills (resolved to IDs after persist)
  prereqs: z.array(z.string()).default([]),
});
export type Skill = z.infer<typeof SkillSchema>;

// Full skill map output from Planner
export const SkillMapSchema = z.object({
  skills: z.array(SkillSchema).min(1).max(20),
});
export type SkillMap = z.infer<typeof SkillMapSchema>;

// A resource attached to a module
export const ResourceSchema = z.object({
  title: z.string().min(1).max(300),
  type: z.enum(['video', 'article', 'exercise', 'book', 'tool', 'other']),
  whatToStudy: z.string().min(1),  // description of what to learn/do — never a bare URL
  url: z.string().url().nullable().default(null),  // nullable — may be null
  isAiSuggested: z.boolean().default(true),
});
export type Resource = z.infer<typeof ResourceSchema>;

// A single check item
export const CheckItemSchema = z.object({
  prompt: z.string().min(1),
  answerKey: z.string().min(1),
  conceptTag: z.string().min(1).max(100),
});
export type CheckItem = z.infer<typeof CheckItemSchema>;

// A full mastery check
export const CheckSchema = z.object({
  items: z.array(CheckItemSchema).min(3).max(6),
});
export type Check = z.infer<typeof CheckSchema>;

// A single module in the path
export const ModuleSchema = z.object({
  skillName: z.string().min(1),  // references a skill by name
  title: z.string().min(1).max(300),
  objective: z.string().min(1),
  estMinutes: z.number().int().min(5).max(300).default(45),
  resources: z.array(ResourceSchema).min(1).max(5),
  check: CheckSchema,
});
export type Module = z.infer<typeof ModuleSchema>;

// Full path output from Planner
export const PathPlanSchema = z.object({
  skills: z.array(SkillSchema).min(1).max(20),
  modules: z.array(ModuleSchema).min(1).max(20),
});
export type PathPlan = z.infer<typeof PathPlanSchema>;

// Planner re-plan moves (typed, frontier-only)
export const ReplanMoveSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('INSERT_PREREQUISITE'),
    newSkill: SkillSchema,
    newModule: ModuleSchema,
    beforeSkillName: z.string(),  // insert the new skill before this one
  }),
  z.object({
    type: z.literal('SPLIT_MODULE'),
    targetSkillName: z.string(),
    replacementSkills: z.array(SkillSchema).min(2).max(3),
    replacementModules: z.array(ModuleSchema).min(2).max(3),
  }),
]);
export type ReplanMove = z.infer<typeof ReplanMoveSchema>;

export const ReplanOutputSchema = z.object({
  move: ReplanMoveSchema,
  reasoning: z.string(),
});
export type ReplanOutput = z.infer<typeof ReplanOutputSchema>;
