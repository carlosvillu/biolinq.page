import { sql, eq } from 'drizzle-orm'
import { db } from '~/db'
import { biolinks } from '~/db/schema/biolinks'
import { dailyStats } from '~/db/schema/dailyStats'

export async function trackView(biolinkId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(biolinks)
      .set({
        totalViews: sql`${biolinks.totalViews} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(biolinks.id, biolinkId))

    const today = sql`DATE_TRUNC('day', NOW())`

    await tx
      .insert(dailyStats)
      .values({
        biolinkId,
        date: today,
        views: 1,
        clicks: 0,
      })
      .onConflictDoUpdate({
        target: [dailyStats.biolinkId, dailyStats.date],
        set: { views: sql`${dailyStats.views} + 1` },
      })
  })
}
