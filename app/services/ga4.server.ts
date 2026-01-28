import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { biolinks } from '~/db/schema/biolinks'
import { users } from '~/db/schema/users'

export type GA4Error =
  | 'BIOLINK_NOT_FOUND'
  | 'INVALID_GA4_FORMAT'
  | 'PREMIUM_REQUIRED'

export type UpdateGA4Result =
  | { success: true }
  | { success: false; error: GA4Error }

const GA4_MEASUREMENT_ID_REGEX = /^G-[A-Z0-9]{10}$/

function isValidGA4MeasurementId(id: string | null): boolean {
  if (id === null) {
    return true
  }
  return GA4_MEASUREMENT_ID_REGEX.test(id)
}

export async function updateGA4MeasurementId(
  biolinkId: string,
  userId: string,
  ga4MeasurementId: string | null
): Promise<UpdateGA4Result> {
  // Validate format
  if (!isValidGA4MeasurementId(ga4MeasurementId)) {
    return { success: false, error: 'INVALID_GA4_FORMAT' }
  }

  // Check if user is premium (only if setting a non-null value)
  if (ga4MeasurementId !== null) {
    const userResult = await db
      .select({ isPremium: users.isPremium })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (userResult.length === 0) {
      return { success: false, error: 'BIOLINK_NOT_FOUND' }
    }

    if (!userResult[0].isPremium) {
      return { success: false, error: 'PREMIUM_REQUIRED' }
    }
  }

  // Update the biolink
  const updateResult = await db
    .update(biolinks)
    .set({
      ga4MeasurementId: ga4MeasurementId,
      updatedAt: new Date(),
    })
    .where(eq(biolinks.id, biolinkId))
    .returning({ id: biolinks.id })

  if (updateResult.length === 0) {
    return { success: false, error: 'BIOLINK_NOT_FOUND' }
  }

  return { success: true }
}

export async function getGA4MeasurementId(
  biolinkId: string
): Promise<string | null> {
  const result = await db
    .select({ ga4MeasurementId: biolinks.ga4MeasurementId })
    .from(biolinks)
    .where(eq(biolinks.id, biolinkId))
    .limit(1)

  if (result.length === 0) {
    return null
  }

  return result[0].ga4MeasurementId
}
