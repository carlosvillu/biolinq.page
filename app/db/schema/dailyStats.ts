import {
  pgTable,
  uuid,
  timestamp,
  integer,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'
import { biolinks } from './biolinks'

export const dailyStats = pgTable(
  'daily_stats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    biolinkId: uuid('biolink_id')
      .notNull()
      .references(() => biolinks.id, { onDelete: 'cascade' }),
    date: timestamp('date').notNull(),
    views: integer('views').notNull().default(0),
    clicks: integer('clicks').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    uniqueBiolinkDate: uniqueIndex('unique_biolink_date').on(
      table.biolinkId,
      table.date
    ),
    biolinkDateIndex: index('idx_daily_stats_biolink_date').on(
      table.biolinkId,
      table.date
    ),
  })
)

export type DailyStat = typeof dailyStats.$inferSelect
export type NewDailyStat = typeof dailyStats.$inferInsert
