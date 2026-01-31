import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const feedbacks = pgTable('feedbacks', {
  id: uuid('id').primaryKey().defaultRandom(),
  emoji: text('emoji').notNull(),
  text: text('text'),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  username: text('username'),
  page: text('page'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export type Feedback = typeof feedbacks.$inferSelect
export type NewFeedback = typeof feedbacks.$inferInsert

export const ALLOWED_EMOJIS = ['😀', '😐', '😕', '😡', '🤯'] as const
export type AllowedEmoji = (typeof ALLOWED_EMOJIS)[number]
