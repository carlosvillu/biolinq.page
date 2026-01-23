import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { biolinks } from '~/db/schema/biolinks'
import { links } from '~/db/schema/links'
import { dailyStats } from '~/db/schema/dailyStats'
import { dailyLinkClicks } from '~/db/schema/dailyLinkClicks'
import { sessions } from '~/db/schema/sessions'
import { accounts } from '~/db/schema/accounts'
import { users } from '~/db/schema/users'
import { removeDomainAlias } from './netlify.server'

export type DeleteAccountError = 'NO_BIOLINK' | 'DATABASE_ERROR' | 'NETLIFY_ERROR'

export type DeleteAccountResult =
  | { success: true }
  | { success: false; error: DeleteAccountError }

/**
 * Deletes a user account and all related data with proper cascade order
 * to avoid foreign key constraint violations.
 *
 * Deletion order:
 * 1. Remove custom domain from Netlify (if exists and verified)
 * 2. daily_link_clicks (depends on links)
 * 3. daily_stats (depends on biolinks)
 * 4. links (depends on biolinks)
 * 5. biolinks (depends on users)
 * 6. sessions (depends on users)
 * 7. accounts (depends on users)
 * 8. users (root entity)
 */
export async function deleteAccount(
  userId: string
): Promise<DeleteAccountResult> {
  try {
    return await db.transaction(async (tx) => {
      // 1. Fetch user's biolink (including custom domain info)
      const userBiolink = await tx
        .select({
          id: biolinks.id,
          customDomain: biolinks.customDomain,
          domainOwnershipVerified: biolinks.domainOwnershipVerified,
        })
        .from(biolinks)
        .where(eq(biolinks.userId, userId))
        .limit(1)

      if (userBiolink.length === 0) {
        return { success: false, error: 'NO_BIOLINK' }
      }

      const biolinkId = userBiolink[0].id
      const { customDomain, domainOwnershipVerified } = userBiolink[0]

      // 2. Remove custom domain from Netlify if it exists and was verified
      if (customDomain && domainOwnershipVerified) {
        const netlifyResult = await removeDomainAlias(customDomain)
        if (!netlifyResult.success) {
          console.error('Failed to remove domain from Netlify:', netlifyResult.error)
          return { success: false, error: 'NETLIFY_ERROR' }
        }
      }

      // 3. Get all link IDs for this biolink
      const biolinkLinks = await tx
        .select({ id: links.id })
        .from(links)
        .where(eq(links.biolinkId, biolinkId))

      const linkIds = biolinkLinks.map((link) => link.id)

      // 4. Delete daily_link_clicks for all links (if there are links)
      if (linkIds.length > 0) {
        for (const linkId of linkIds) {
          await tx.delete(dailyLinkClicks).where(eq(dailyLinkClicks.linkId, linkId))
        }
      }

      // 5. Delete daily_stats for this biolink
      await tx.delete(dailyStats).where(eq(dailyStats.biolinkId, biolinkId))

      // 6. Delete links for this biolink
      await tx.delete(links).where(eq(links.biolinkId, biolinkId))

      // 7. Delete biolink
      await tx.delete(biolinks).where(eq(biolinks.id, biolinkId))

      // 8. Delete sessions for this user
      await tx.delete(sessions).where(eq(sessions.userId, userId))

      // 9. Delete accounts for this user
      await tx.delete(accounts).where(eq(accounts.userId, userId))

      // 10. Delete user
      await tx.delete(users).where(eq(users.id, userId))

      return { success: true }
    })
  } catch (error) {
    console.error('Error deleting account:', error)
    return { success: false, error: 'DATABASE_ERROR' }
  }
}
