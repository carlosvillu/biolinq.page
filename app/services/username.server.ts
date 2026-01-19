import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { biolinks, type Biolink } from '~/db/schema/biolinks'
import { users } from '~/db/schema/users'
import { isReservedUsername } from '~/lib/constants'

export type UsernameError =
  | 'USERNAME_TAKEN'
  | 'USERNAME_RESERVED'
  | 'USER_ALREADY_HAS_BIOLINK'

export type CheckUsernameResult =
  | { available: true }
  | { available: false; reason: UsernameError }

export type RegisterUsernameResult =
  | { success: true; biolink: Biolink }
  | { success: false; error: UsernameError }

export async function checkUsernameAvailability(
  username: string
): Promise<CheckUsernameResult> {
  if (isReservedUsername(username)) {
    return { available: false, reason: 'USERNAME_RESERVED' }
  }

  const existingBiolink = await db
    .select({ id: biolinks.id })
    .from(biolinks)
    .where(eq(biolinks.username, username))
    .limit(1)

  if (existingBiolink.length > 0) {
    return { available: false, reason: 'USERNAME_TAKEN' }
  }

  return { available: true }
}

type PgError = {
  code?: string
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as PgError).code === '23505'
  )
}

export async function registerUsername(
  userId: string,
  username: string
): Promise<RegisterUsernameResult> {
  return db.transaction(async (tx) => {
    const existingUserBiolink = await tx
      .select({ id: biolinks.id })
      .from(biolinks)
      .where(eq(biolinks.userId, userId))
      .limit(1)

    if (existingUserBiolink.length > 0) {
      return { success: false, error: 'USER_ALREADY_HAS_BIOLINK' }
    }

    if (isReservedUsername(username)) {
      return { success: false, error: 'USERNAME_RESERVED' }
    }

    const existingUsername = await tx
      .select({ id: biolinks.id })
      .from(biolinks)
      .where(eq(biolinks.username, username))
      .limit(1)

    if (existingUsername.length > 0) {
      return { success: false, error: 'USERNAME_TAKEN' }
    }

    try {
      const [biolink] = await tx
        .insert(biolinks)
        .values({
          userId,
          username,
          customPrimaryColor: null,
          customBgColor: null,
        })
        .returning()

      return { success: true, biolink }
    } catch (error) {
      if (isUniqueViolation(error)) {
        return { success: false, error: 'USERNAME_TAKEN' }
      }
      throw error
    }
  })
}

export async function getUserBiolink(userId: string): Promise<Biolink | null> {
  const result = await db
    .select()
    .from(biolinks)
    .where(eq(biolinks.userId, userId))
    .limit(1)

  return result[0] ?? null
}

export type BiolinkWithUser = {
  biolink: Biolink
  user: {
    name: string | null
    image: string | null
    isPremium: boolean
  }
}

export async function getBiolinkWithUserByUsername(
  username: string
): Promise<BiolinkWithUser | null> {
  const result = await db
    .select({
      biolink: biolinks,
      user: {
        name: users.name,
        image: users.image,
        isPremium: users.isPremium,
      },
    })
    .from(biolinks)
    .innerJoin(users, eq(biolinks.userId, users.id))
    .where(eq(biolinks.username, username.toLowerCase()))
    .limit(1)

  if (result.length === 0) {
    return null
  }

  return result[0]
}
