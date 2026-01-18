import { relations } from 'drizzle-orm'
import { users } from './users'
import { sessions } from './sessions'
import { accounts } from './accounts'
import { biolinks } from './biolinks'
import { links } from './links'
import { dailyStats } from './dailyStats'
import { dailyLinkClicks } from './dailyLinkClicks'

export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  biolink: one(biolinks),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}))

export const biolinksRelations = relations(biolinks, ({ one, many }) => ({
  user: one(users, {
    fields: [biolinks.userId],
    references: [users.id],
  }),
  links: many(links),
  dailyStats: many(dailyStats),
}))

export const linksRelations = relations(links, ({ one, many }) => ({
  biolink: one(biolinks, {
    fields: [links.biolinkId],
    references: [biolinks.id],
  }),
  dailyLinkClicks: many(dailyLinkClicks),
}))

export const dailyStatsRelations = relations(dailyStats, ({ one }) => ({
  biolink: one(biolinks, {
    fields: [dailyStats.biolinkId],
    references: [biolinks.id],
  }),
}))

export const dailyLinkClicksRelations = relations(dailyLinkClicks, ({ one }) => ({
  link: one(links, {
    fields: [dailyLinkClicks.linkId],
    references: [links.id],
  }),
}))
