import {
  pgTable,
  uuid,
  timestamp,
  integer,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'
import { links } from './links'

export const dailyLinkClicks = pgTable(
  'daily_link_clicks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    linkId: uuid('link_id')
      .notNull()
      .references(() => links.id, { onDelete: 'cascade' }),
    date: timestamp('date').notNull(),
    clicks: integer('clicks').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    uniqueLinkDate: uniqueIndex('unique_link_date').on(
      table.linkId,
      table.date
    ),
    linkDateIndex: index('idx_daily_link_clicks_link_date').on(
      table.linkId,
      table.date
    ),
  })
)

export type DailyLinkClick = typeof dailyLinkClicks.$inferSelect
export type NewDailyLinkClick = typeof dailyLinkClicks.$inferInsert
