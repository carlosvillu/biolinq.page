import { eq, inArray } from 'drizzle-orm'
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
 * Deletes a user account and all related data.
 *
 * External cleanup (Netlify) runs before the DB transaction to avoid
 * holding a long transaction open on external API calls.
 *
 * DB deletion order (in transaction, to avoid FK violations):
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
  // 1. Fetch user's biolink (including custom domain info) before transaction
  const userBiolink = await db
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

  // 2. Remove custom domain from Netlify before starting the DB transaction
  if (customDomain && domainOwnershipVerified) {
    const netlifyResult = await removeDomainAlias(customDomain)
    if (!netlifyResult.success) {
      console.error('Failed to remove domain from Netlify:', netlifyResult.error)
      return { success: false, error: 'NETLIFY_ERROR' }
    }
  }

  try {
    // 3. Delete all database records in a transaction
    await db.transaction(async (tx) => {
      // Get all link IDs for this biolink
      const biolinkLinks = await tx
        .select({ id: links.id })
        .from(links)
        .where(eq(links.biolinkId, biolinkId))

      const linkIds = biolinkLinks.map((link) => link.id)

      // Delete daily_link_clicks for all links in batch
      if (linkIds.length > 0) {
        await tx.delete(dailyLinkClicks).where(inArray(dailyLinkClicks.linkId, linkIds))
      }

      // Delete daily_stats for this biolink
      await tx.delete(dailyStats).where(eq(dailyStats.biolinkId, biolinkId))

      // Delete links for this biolink
      await tx.delete(links).where(eq(links.biolinkId, biolinkId))

      // Delete biolink
      await tx.delete(biolinks).where(eq(biolinks.id, biolinkId))

      // Delete sessions for this user
      await tx.delete(sessions).where(eq(sessions.userId, userId))

      // Delete accounts for this user
      await tx.delete(accounts).where(eq(accounts.userId, userId))

      // Delete user
      await tx.delete(users).where(eq(users.id, userId))
    })

    return { success: true }
  } catch (error) {
    console.error('Error deleting account:', error)
    return { success: false, error: 'DATABASE_ERROR' }
  }
}
