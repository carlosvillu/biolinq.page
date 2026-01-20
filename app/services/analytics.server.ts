import { eq, and, gte, asc } from 'drizzle-orm'
import { db } from '~/db'
import { biolinks } from '~/db/schema/biolinks'
import { links } from '~/db/schema/links'
import { users } from '~/db/schema/users'
import { dailyStats } from '~/db/schema/dailyStats'

export type AnalyticsError = 'NOT_FOUND' | 'FORBIDDEN' | 'PREMIUM_REQUIRED'

export type BasicStats = {
  totalViews: number
}

export type LinkBreakdown = {
  linkId: string
  title: string
  emoji: string | null
  totalClicks: number
}

export type PremiumStats = {
  totalViews: number
  totalClicks: number
  linksBreakdown: LinkBreakdown[]
}

export type DailyDataPoint = {
  date: string
  views: number
  clicks: number
}

export type GetBasicStatsResult =
  | { success: true; data: BasicStats }
  | { success: false; error: AnalyticsError }

export type GetPremiumStatsResult =
  | { success: true; data: PremiumStats }
  | { success: false; error: AnalyticsError }

export type GetLast30DaysDataResult =
  | { success: true; data: DailyDataPoint[] }
  | { success: false; error: AnalyticsError }

export async function getBasicStats(
  biolinkId: string,
  userId: string
): Promise<GetBasicStatsResult> {
  const result = await db
    .select({
      id: biolinks.id,
      userId: biolinks.userId,
      totalViews: biolinks.totalViews,
    })
    .from(biolinks)
    .where(eq(biolinks.id, biolinkId))
    .limit(1)

  if (result.length === 0) {
    return { success: false, error: 'NOT_FOUND' }
  }

  const biolink = result[0]

  if (biolink.userId !== userId) {
    return { success: false, error: 'FORBIDDEN' }
  }

  return {
    success: true,
    data: { totalViews: biolink.totalViews },
  }
}

export async function getPremiumStats(
  biolinkId: string,
  userId: string
): Promise<GetPremiumStatsResult> {
  const result = await db
    .select({
      id: biolinks.id,
      userId: biolinks.userId,
      totalViews: biolinks.totalViews,
      isPremium: users.isPremium,
    })
    .from(biolinks)
    .innerJoin(users, eq(biolinks.userId, users.id))
    .where(eq(biolinks.id, biolinkId))
    .limit(1)

  if (result.length === 0) {
    return { success: false, error: 'NOT_FOUND' }
  }

  const biolink = result[0]

  if (biolink.userId !== userId) {
    return { success: false, error: 'FORBIDDEN' }
  }

  if (!biolink.isPremium) {
    return { success: false, error: 'PREMIUM_REQUIRED' }
  }

  const linksList = await db
    .select({
      id: links.id,
      title: links.title,
      emoji: links.emoji,
      totalClicks: links.totalClicks,
    })
    .from(links)
    .where(eq(links.biolinkId, biolinkId))
    .orderBy(asc(links.position))

  const totalClicks = linksList.reduce((sum, link) => sum + link.totalClicks, 0)

  const linksBreakdown: LinkBreakdown[] = linksList.map((link) => ({
    linkId: link.id,
    title: link.title,
    emoji: link.emoji,
    totalClicks: link.totalClicks,
  }))

  return {
    success: true,
    data: {
      totalViews: biolink.totalViews,
      totalClicks,
      linksBreakdown,
    },
  }
}

export async function getLast7DaysData(
  biolinkId: string,
  userId: string
): Promise<GetLast30DaysDataResult> {
  const result = await db
    .select({
      id: biolinks.id,
      userId: biolinks.userId,
      isPremium: users.isPremium,
    })
    .from(biolinks)
    .innerJoin(users, eq(biolinks.userId, users.id))
    .where(eq(biolinks.id, biolinkId))
    .limit(1)

  if (result.length === 0) {
    return { success: false, error: 'NOT_FOUND' }
  }

  const biolink = result[0]

  if (biolink.userId !== userId) {
    return { success: false, error: 'FORBIDDEN' }
  }

  if (!biolink.isPremium) {
    return { success: false, error: 'PREMIUM_REQUIRED' }
  }

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const dailyData = await db
    .select({
      date: dailyStats.date,
      views: dailyStats.views,
      clicks: dailyStats.clicks,
    })
    .from(dailyStats)
    .where(
      and(eq(dailyStats.biolinkId, biolinkId), gte(dailyStats.date, sevenDaysAgo))
    )
    .orderBy(asc(dailyStats.date))

  const dataPoints: DailyDataPoint[] = dailyData.map((row) => ({
    date: row.date.toISOString().split('T')[0],
    views: row.views,
    clicks: row.clicks,
  }))

  return {
    success: true,
    data: dataPoints,
  }
}

export async function getLast30DaysData(
  biolinkId: string,
  userId: string
): Promise<GetLast30DaysDataResult> {
  const result = await db
    .select({
      id: biolinks.id,
      userId: biolinks.userId,
      isPremium: users.isPremium,
    })
    .from(biolinks)
    .innerJoin(users, eq(biolinks.userId, users.id))
    .where(eq(biolinks.id, biolinkId))
    .limit(1)

  if (result.length === 0) {
    return { success: false, error: 'NOT_FOUND' }
  }

  const biolink = result[0]

  if (biolink.userId !== userId) {
    return { success: false, error: 'FORBIDDEN' }
  }

  if (!biolink.isPremium) {
    return { success: false, error: 'PREMIUM_REQUIRED' }
  }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  thirtyDaysAgo.setHours(0, 0, 0, 0)

  const dailyData = await db
    .select({
      date: dailyStats.date,
      views: dailyStats.views,
      clicks: dailyStats.clicks,
    })
    .from(dailyStats)
    .where(
      and(eq(dailyStats.biolinkId, biolinkId), gte(dailyStats.date, thirtyDaysAgo))
    )
    .orderBy(asc(dailyStats.date))

  const dataPoints: DailyDataPoint[] = dailyData.map((row) => ({
    date: row.date.toISOString().split('T')[0],
    views: row.views,
    clicks: row.clicks,
  }))

  return {
    success: true,
    data: dataPoints,
  }
}
