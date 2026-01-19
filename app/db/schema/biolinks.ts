import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core'
import { users } from './users'

export const biolinkTheme = pgEnum('biolink_theme', [
  'brutalist',
  'light_minimal',
  'dark_mode',
  'colorful',
])

export const biolinks = pgTable(
  'biolinks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    username: varchar('username', { length: 20 }).notNull().unique(),
    theme: biolinkTheme('theme').notNull().default('brutalist'),
    customPrimaryColor: varchar('custom_primary_color', { length: 7 }),
    customBgColor: varchar('custom_bg_color', { length: 7 }),
    totalViews: integer('total_views').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    usernameIndex: index('idx_biolinks_username').on(table.username),
  })
)

export type Biolink = typeof biolinks.$inferSelect
export type NewBiolink = typeof biolinks.$inferInsert
export type BiolinkTheme = (typeof biolinkTheme.enumValues)[number]
