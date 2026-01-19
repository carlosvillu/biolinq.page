import { eq, and, gt, sql } from 'drizzle-orm'
import { db } from '~/db'
import { links, type Link } from '~/db/schema/links'
import { biolinks } from '~/db/schema/biolinks'
import { getMaxLinks } from '~/lib/constants'
import { createLinkSchema, type CreateLinkInput } from '~/lib/link-validation'

export type LinkError =
  | 'BIOLINK_NOT_FOUND'
  | 'NOT_OWNER'
  | 'MAX_LINKS_REACHED'
  | 'LINK_NOT_FOUND'
  | 'INVALID_LINK_IDS'

export type GetLinksResult =
  | { success: true; links: Link[] }
  | { success: false; error: LinkError }

export type CreateLinkResult =
  | { success: true; link: Link }
  | { success: false; error: LinkError }

export type DeleteLinkResult =
  | { success: true }
  | { success: false; error: LinkError }

export type ReorderLinksResult =
  | { success: true }
  | { success: false; error: LinkError }

async function validateOwnership(
  userId: string,
  biolinkId: string
): Promise<boolean> {
  const result = await db
    .select({ id: biolinks.id })
    .from(biolinks)
    .where(and(eq(biolinks.id, biolinkId), eq(biolinks.userId, userId)))
    .limit(1)

  return result.length > 0
}

export async function getLinksByBiolinkId(
  userId: string,
  biolinkId: string
): Promise<GetLinksResult> {
  const isOwner = await validateOwnership(userId, biolinkId)
  if (!isOwner) {
    return { success: false, error: 'NOT_OWNER' }
  }

  const result = await db
    .select()
    .from(links)
    .where(eq(links.biolinkId, biolinkId))
    .orderBy(links.position)

  return { success: true, links: result }
}

export async function createLink(
  userId: string,
  biolinkId: string,
  data: CreateLinkInput
): Promise<CreateLinkResult> {
  const isOwner = await validateOwnership(userId, biolinkId)
  if (!isOwner) {
    return { success: false, error: 'NOT_OWNER' }
  }

  const count = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(links)
    .where(eq(links.biolinkId, biolinkId))

  const currentCount = count[0]?.count ?? 0

  if (currentCount >= getMaxLinks(false)) {
    return { success: false, error: 'MAX_LINKS_REACHED' }
  }

  const parsed = createLinkSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error('Invalid link data')
  }

  const position = currentCount

  const [link] = await db
    .insert(links)
    .values({
      biolinkId,
      emoji: parsed.data.emoji ?? null,
      title: parsed.data.title,
      url: parsed.data.url,
      position,
    })
    .returning()

  return { success: true, link }
}

export async function deleteLink(
  userId: string,
  linkId: string
): Promise<DeleteLinkResult> {
  return db.transaction(async (tx) => {
    const linkResult = await tx
      .select()
      .from(links)
      .where(eq(links.id, linkId))
      .limit(1)

    if (linkResult.length === 0) {
      return { success: false, error: 'LINK_NOT_FOUND' }
    }

    const link = linkResult[0]

    const isOwner = await tx
      .select({ id: biolinks.id })
      .from(biolinks)
      .where(and(eq(biolinks.id, link.biolinkId), eq(biolinks.userId, userId)))
      .limit(1)

    if (isOwner.length === 0) {
      return { success: false, error: 'NOT_OWNER' }
    }

    const deletedPosition = link.position

    await tx.delete(links).where(eq(links.id, linkId))

    await tx
      .update(links)
      .set({ position: sql`${links.position} - 1` })
      .where(
        and(
          eq(links.biolinkId, link.biolinkId),
          gt(links.position, deletedPosition)
        )
      )

    return { success: true }
  })
}

export async function reorderLinks(
  userId: string,
  biolinkId: string,
  linkIds: string[]
): Promise<ReorderLinksResult> {
  return db.transaction(async (tx) => {
    const isOwner = await tx
      .select({ id: biolinks.id })
      .from(biolinks)
      .where(and(eq(biolinks.id, biolinkId), eq(biolinks.userId, userId)))
      .limit(1)

    if (isOwner.length === 0) {
      return { success: false, error: 'NOT_OWNER' }
    }

    const existingLinks = await tx
      .select()
      .from(links)
      .where(eq(links.biolinkId, biolinkId))

    const existingIds = new Set(existingLinks.map((l) => l.id))
    const providedIds = new Set(linkIds)

    if (
      existingIds.size !== providedIds.size ||
      ![...existingIds].every((id) => providedIds.has(id))
    ) {
      return { success: false, error: 'INVALID_LINK_IDS' }
    }

    for (const [index, linkId] of linkIds.entries()) {
      await tx
        .update(links)
        .set({ position: index })
        .where(eq(links.id, linkId))
    }

    return { success: true }
  })
}

export async function getPublicLinksByBiolinkId(biolinkId: string): Promise<Link[]> {
  const result = await db
    .select()
    .from(links)
    .where(eq(links.biolinkId, biolinkId))
    .orderBy(links.position)

  return result
}
