import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { biolinks, type BiolinkTheme } from '~/db/schema/biolinks'
import { users } from '~/db/schema/users'
import { THEMES } from '~/lib/themes'

export type ThemeError = 'BIOLINK_NOT_FOUND' | 'INVALID_THEME'
export type ColorsError =
  | 'BIOLINK_NOT_FOUND'
  | 'INVALID_COLOR_FORMAT'
  | 'PREMIUM_REQUIRED'
export type Ga4TrackingError = 'BIOLINK_NOT_FOUND' | 'INVALID_FORMAT' | 'PREMIUM_REQUIRED'

export type UpdateThemeResult =
  | { success: true }
  | { success: false; error: ThemeError }

export type UpdateColorsResult =
  | { success: true }
  | { success: false; error: ColorsError }

export type UpdateGa4TrackingResult =
  | { success: true }
  | { success: false; error: Ga4TrackingError }

export type CustomColors = {
  primaryColor: string | null
  bgColor: string | null
}

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/
const GA4_ID_REGEX = /^G-[A-Z0-9]{10}$/

function isValidTheme(theme: string): theme is BiolinkTheme {
  return theme in THEMES
}

function isValidHexColor(color: string | null): boolean {
  if (color === null) {
    return true
  }
  return HEX_COLOR_REGEX.test(color)
}

export async function updateBiolinkTheme(
  biolinkId: string,
  theme: BiolinkTheme
): Promise<UpdateThemeResult> {
  if (!isValidTheme(theme)) {
    return { success: false, error: 'INVALID_THEME' }
  }

  const updateResult = await db
    .update(biolinks)
    .set({ theme, updatedAt: new Date() })
    .where(eq(biolinks.id, biolinkId))
    .returning({ id: biolinks.id })

  if (updateResult.length === 0) {
    return { success: false, error: 'BIOLINK_NOT_FOUND' }
  }

  return { success: true }
}

export async function updateBiolinkColors(
  biolinkId: string,
  customColors: CustomColors
): Promise<UpdateColorsResult> {
  if (!isValidHexColor(customColors.primaryColor)) {
    return { success: false, error: 'INVALID_COLOR_FORMAT' }
  }
  if (!isValidHexColor(customColors.bgColor)) {
    return { success: false, error: 'INVALID_COLOR_FORMAT' }
  }

  const hasCustomColors =
    customColors.primaryColor !== null || customColors.bgColor !== null

  if (hasCustomColors) {
    const result = await db
      .select({
        id: biolinks.id,
        isPremium: users.isPremium,
      })
      .from(biolinks)
      .innerJoin(users, eq(biolinks.userId, users.id))
      .where(eq(biolinks.id, biolinkId))
      .limit(1)

    if (result.length === 0) {
      return { success: false, error: 'BIOLINK_NOT_FOUND' }
    }

    if (!result[0].isPremium) {
      return { success: false, error: 'PREMIUM_REQUIRED' }
    }
  }

  const updateResult = await db
    .update(biolinks)
    .set({
      customPrimaryColor: customColors.primaryColor,
      customBgColor: customColors.bgColor,
      updatedAt: new Date(),
    })
    .where(eq(biolinks.id, biolinkId))
    .returning({ id: biolinks.id })

  if (updateResult.length === 0) {
    return { success: false, error: 'BIOLINK_NOT_FOUND' }
  }

  return { success: true }
}

function isValidGa4TrackingId(trackingId: string | null): boolean {
  if (trackingId === null || trackingId === '') {
    return true
  }
  return GA4_ID_REGEX.test(trackingId)
}

export async function updateBiolinkGa4TrackingId(
  biolinkId: string,
  ga4TrackingId: string | null
): Promise<UpdateGa4TrackingResult> {
  if (!isValidGa4TrackingId(ga4TrackingId)) {
    return { success: false, error: 'INVALID_FORMAT' }
  }

  // Check if user is premium when setting a tracking ID
  if (ga4TrackingId && ga4TrackingId !== '') {
    const result = await db
      .select({
        id: biolinks.id,
        isPremium: users.isPremium,
      })
      .from(biolinks)
      .innerJoin(users, eq(biolinks.userId, users.id))
      .where(eq(biolinks.id, biolinkId))
      .limit(1)

    if (result.length === 0) {
      return { success: false, error: 'BIOLINK_NOT_FOUND' }
    }

    if (!result[0].isPremium) {
      return { success: false, error: 'PREMIUM_REQUIRED' }
    }
  }

  const updateResult = await db
    .update(biolinks)
    .set({
      customGa4TrackingId: ga4TrackingId || null,
      updatedAt: new Date(),
    })
    .where(eq(biolinks.id, biolinkId))
    .returning({ id: biolinks.id })

  if (updateResult.length === 0) {
    return { success: false, error: 'BIOLINK_NOT_FOUND' }
  }

  return { success: true }
}
