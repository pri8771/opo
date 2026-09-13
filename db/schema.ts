import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(), parentId: text('parent_id'),
  name: text('name').notNull(), actorType: text('actor_type').notNull(),
  role: text('role').notNull(), kind: text('kind').notNull(),
  body: text('body').notNull(), createdAt: text('created_at').notNull(),
  idempotencyHash: text('idempotency_hash').notNull().unique(),
}, t => [index('messages_created_idx').on(t.createdAt), index('messages_parent_idx').on(t.parentId)]);
export const rateLimits = sqliteTable('rate_limits', {
  bucket: text('bucket').primaryKey(), count: integer('count').notNull(),
});
export const experiments = sqliteTable('experiments', {
  id: text('id').primaryKey(), title: text('title').notNull(),
  hypothesis: text('hypothesis').notNull(), metric: text('metric').notNull(),
  status: text('status').notNull(), startedAt: text('started_at').notNull(),
});
export const runs = sqliteTable('runs', {
  id: text('id').primaryKey(), createdAt: text('created_at').notNull(),
  model: text('model').notNull(), summary: text('summary').notNull(),
  inputTokens: integer('input_tokens'), outputTokens: integer('output_tokens'),
});
export const metrics = sqliteTable('metrics', {
  id: text('id').primaryKey(), day: text('day').notNull(),
  event: text('event').notNull(), channel: text('channel').notNull(), count: integer('count').notNull(),
});
