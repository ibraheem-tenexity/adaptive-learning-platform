import { pgTable, uuid, varchar, text, integer, boolean, real, timestamp, pgEnum, primaryKey, jsonb, serial } from 'drizzle-orm/pg-core';

export const moduleStatusEnum = pgEnum('module_status', ['locked', 'available', 'in_progress', 'mastered', 'stuck', 'review']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const goals = pgTable('goals', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  text: text('text').notNull(),
  targetLevel: varchar('target_level', { length: 50 }).notNull(),
  weeklyMinutes: integer('weekly_minutes').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const skills = pgTable('skills', {
  id: uuid('id').defaultRandom().primaryKey(),
  goalId: uuid('goal_id').notNull().references(() => goals.id),
  name: varchar('name', { length: 200 }).notNull(),
  objective: text('objective').notNull(),
  difficultySeed: real('difficulty_seed').notNull().default(0.5),
  position: integer('position').notNull().default(0),
});

export const skillEdges = pgTable('skill_edges', {
  goalId: uuid('goal_id').notNull().references(() => goals.id),
  prereqSkillId: uuid('prereq_skill_id').notNull().references(() => skills.id),
  skillId: uuid('skill_id').notNull().references(() => skills.id),
}, (t) => ({
  pk: primaryKey({ columns: [t.goalId, t.prereqSkillId, t.skillId] }),
}));

export const paths = pgTable('paths', {
  id: uuid('id').defaultRandom().primaryKey(),
  goalId: uuid('goal_id').notNull().references(() => goals.id),
  version: integer('version').notNull().default(1),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const modules = pgTable('modules', {
  id: uuid('id').defaultRandom().primaryKey(),
  pathId: uuid('path_id').notNull().references(() => paths.id),
  skillId: uuid('skill_id').notNull().references(() => skills.id),
  position: integer('position').notNull(),
  title: varchar('title', { length: 300 }).notNull(),
  objective: text('objective').notNull(),
  estMinutes: integer('est_minutes').notNull().default(45),
  status: moduleStatusEnum('status').notNull().default('locked'),
});

export const resources = pgTable('resources', {
  id: uuid('id').defaultRandom().primaryKey(),
  moduleId: uuid('module_id').notNull().references(() => modules.id),
  title: varchar('title', { length: 300 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  urlOrDescription: text('url_or_description').notNull(),
  isAiSuggested: boolean('is_ai_suggested').notNull().default(true),
});

export const checks = pgTable('checks', {
  id: uuid('id').defaultRandom().primaryKey(),
  moduleId: uuid('module_id').notNull().references(() => modules.id),
  kind: varchar('kind', { length: 50 }).notNull().default('mastery'),
});

export const checkItems = pgTable('check_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  checkId: uuid('check_id').notNull().references(() => checks.id),
  prompt: text('prompt').notNull(),
  answerKey: text('answer_key').notNull(),
  conceptTag: varchar('concept_tag', { length: 100 }).notNull(),
});

export const attempts = pgTable('attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  checkItemId: uuid('check_item_id').notNull().references(() => checkItems.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  response: text('response').notNull(),
  correct: boolean('correct').notNull(),
  ts: timestamp('ts').defaultNow().notNull(),
});

export const mastery = pgTable('mastery', {
  userId: uuid('user_id').notNull().references(() => users.id),
  skillId: uuid('skill_id').notNull().references(() => skills.id),
  masteredBool: boolean('mastered_bool').notNull().default(false),
  score: real('score').notNull().default(0),
  ts: timestamp('ts').defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.skillId] }),
}));

export const reviewState = pgTable('review_state', {
  userId: uuid('user_id').notNull().references(() => users.id),
  skillId: uuid('skill_id').notNull().references(() => skills.id),
  difficulty: real('difficulty').notNull().default(0.3),
  stability: real('stability').notNull().default(1.0),
  retrievability: real('retrievability').notNull().default(1.0),
  dueAt: timestamp('due_at').notNull(),
  lastReviewedAt: timestamp('last_reviewed_at'),
  lapses: integer('lapses').notNull().default(0),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.skillId] }),
}));

export const replanEvents = pgTable('replan_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  pathId: uuid('path_id').notNull().references(() => paths.id),
  trigger: varchar('trigger', { length: 100 }).notNull(),
  reasonText: text('reason_text'),
  beforeJson: jsonb('before_json'),
  afterJson: jsonb('after_json'),
  ts: timestamp('ts').defaultNow().notNull(),
});

export const diagnostics = pgTable('diagnostics', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  goalId: uuid('goal_id').notNull().references(() => goals.id),
  item: text('item').notNull(),
  response: text('response').notNull(),
  correct: boolean('correct').notNull(),
  inferredLevel: real('inferred_level').notNull().default(0.5),
});
