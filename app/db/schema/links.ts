import { pgTable, uuid, varchar, text, integer, timestamp } from 'drizzle-orm/pg-core'
import { biolinks } from './biolinks'

export const links = pgTable('links', {
  id: uuid('id').primaryKey().defaultRandom(),
  biolinkId: uuid('biolink_id')
    .notNull()
    .references(() => biolinks.id, { onDelete: 'cascade' }),
  emoji: varchar('emoji', { length: 10 }),
  title: varchar('title', { length: 50 }).notNull(),
  url: text('url').notNull(),
  position: integer('position').notNull(),
  totalClicks: integer('total_clicks').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type Link = typeof links.$inferSelect
export type NewLink = typeof links.$inferInsert
