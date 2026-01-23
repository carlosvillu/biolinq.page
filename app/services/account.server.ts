import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { biolinks } from '~/db/schema/biolinks'
import { links } from '~/db/schema/links'
import { dailyStats } from '~/db/schema/dailyStats'
import { dailyLinkClicks } from '~/db/schema/dailyLinkClicks'
import { sessions } from '~/db/schema/sessions'
import { accounts } from '~/db/schema/accounts'
import { users } from '~/db/schema/users'

export type DeleteAccountError = 'NO_BIOLINK' | 'DATABASE_ERROR'

export type DeleteAccountResult =
  | { success: true }
  | { success: false; error: DeleteAccountError }

/**
 * Deletes a user account and all related data with proper cascade order
 * to avoid foreign key constraint violations.
 *
 * Deletion order:
 * 1. daily_link_clicks (depends on links)
 * 2. daily_stats (depends on biolinks)
 * 3. links (depends on biolinks)
 * 4. biolinks (depends on users)
 * 5. sessions (depends on users)
 * 6. accounts (depends on users)
 * 7. users (root entity)
 */
export async function deleteAccount(
  userId: string
): Promise<DeleteAccountResult> {
  try {
    return await db.transaction(async (tx) => {
      // 1. Fetch user's biolink
      const userBiolink = await tx
        .select({ id: biolinks.id })
        .from(biolinks)
        .where(eq(biolinks.userId, userId))
        .limit(1)

      if (userBiolink.length === 0) {
        return { success: false, error: 'NO_BIOLINK' }
      }

      const biolinkId = userBiolink[0].id

      // 2. Get all link IDs for this biolink
      const biolinkLinks = await tx
        .select({ id: links.id })
        .from(links)
        .where(eq(links.biolinkId, biolinkId))

      const linkIds = biolinkLinks.map((link) => link.id)

      // 3. Delete daily_link_clicks for all links (if there are links)
      if (linkIds.length > 0) {
        for (const linkId of linkIds) {
          await tx.delete(dailyLinkClicks).where(eq(dailyLinkClicks.linkId, linkId))
        }
      }

      // 4. Delete daily_stats for this biolink
      await tx.delete(dailyStats).where(eq(dailyStats.biolinkId, biolinkId))

      // 5. Delete links for this biolink
      await tx.delete(links).where(eq(links.biolinkId, biolinkId))

      // 6. Delete biolink
      await tx.delete(biolinks).where(eq(biolinks.id, biolinkId))

      // 7. Delete sessions for this user
      await tx.delete(sessions).where(eq(sessions.userId, userId))

      // 8. Delete accounts for this user
      await tx.delete(accounts).where(eq(accounts.userId, userId))

      // 9. Delete user
      await tx.delete(users).where(eq(users.id, userId))

      return { success: true }
    })
  } catch (error) {
    console.error('Error deleting account:', error)
    return { success: false, error: 'DATABASE_ERROR' }
  }
}
