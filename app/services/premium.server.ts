import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { users } from '~/db/schema/users'

export async function grantPremium(
  userId: string,
  stripeCustomerId: string | null
): Promise<void> {
  // Verificar si ya es premium (idempotencia)
  const userResult = await db
    .select({ id: users.id, isPremium: users.isPremium })
    .from(users)
    .where(eq(users.id, userId))

  if (userResult.length === 0) {
    throw new Error('User not found')
  }

  const user = userResult[0]

  if (user.isPremium) {
    return // Ya es premium, no hacer nada
  }

  // Actualizar usuario
  await db
    .update(users)
    .set({
      isPremium: true,
      stripeCustomerId: stripeCustomerId,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId))
}

export async function getPremiumStatus(
  userId: string
): Promise<{ isPremium: boolean; stripeCustomerId: string | null }> {
  const userResult = await db
    .select({ isPremium: users.isPremium, stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, userId))

  if (userResult.length === 0) {
    throw new Error('User not found')
  }

  const user = userResult[0]

  return {
    isPremium: user.isPremium,
    stripeCustomerId: user.stripeCustomerId
  }
}
