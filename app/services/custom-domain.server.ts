import crypto from 'node:crypto'
import dns from 'node:dns/promises'
import { eq, and, ne } from 'drizzle-orm'
import { db } from '~/db'
import { biolinks } from '~/db/schema/biolinks'
import { users } from '~/db/schema/users'
import { addDomainAlias, removeDomainAlias } from './netlify.server'

export type CustomDomainError =
  | 'PREMIUM_REQUIRED'
  | 'INVALID_DOMAIN_FORMAT'
  | 'DOMAIN_ALREADY_TAKEN'
  | 'BIOLINK_NOT_FOUND'
  | 'NETLIFY_ERROR'
  | 'DOMAIN_NOT_SET'
  | 'OWNERSHIP_NOT_VERIFIED'

export type SetDomainResult =
  | { success: true; domain: string; verificationToken: string }
  | { success: false; error: CustomDomainError }

export type RemoveDomainResult = { success: true } | { success: false; error: CustomDomainError }

export type VerifyOwnershipResult =
  | { success: true; verified: boolean }
  | { success: false; error: CustomDomainError }

export type VerifyCNAMEResult =
  | { success: true; verified: boolean }
  | { success: false; error: CustomDomainError }

export type ResolveDomainResult =
  | {
      success: true
      biolink: {
        id: string
        username: string
        theme: 'brutalist' | 'light_minimal' | 'dark_mode' | 'colorful'
        customPrimaryColor: string | null
        customBgColor: string | null
        customGa4TrackingId: string | null
      }
      user: { name: string | null; image: string | null; isPremium: boolean }
    }
  | { success: false }

const DOMAIN_REGEX = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i

const BLOCKED_DOMAINS = ['biolinq.page', 'biolinq.netlify.app', 'netlify.app', 'netlify.com']

function isValidDomainFormat(domain: string): boolean {
  if (!DOMAIN_REGEX.test(domain)) {
    return false
  }
  for (const blocked of BLOCKED_DOMAINS) {
    if (domain === blocked || domain.endsWith('.' + blocked)) {
      return false
    }
  }
  return true
}

function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function setCustomDomain(
  userId: string,
  biolinkId: string,
  domain: string
): Promise<SetDomainResult> {
  const normalizedDomain = domain.toLowerCase().trim()

  if (!isValidDomainFormat(normalizedDomain)) {
    return { success: false, error: 'INVALID_DOMAIN_FORMAT' }
  }

  const userResult = await db.select({ isPremium: users.isPremium }).from(users).where(eq(users.id, userId))

  if (userResult.length === 0 || !userResult[0].isPremium) {
    return { success: false, error: 'PREMIUM_REQUIRED' }
  }

  const biolinkResult = await db
    .select({ id: biolinks.id, customDomain: biolinks.customDomain })
    .from(biolinks)
    .where(and(eq(biolinks.id, biolinkId), eq(biolinks.userId, userId)))

  if (biolinkResult.length === 0) {
    return { success: false, error: 'BIOLINK_NOT_FOUND' }
  }

  const existingResult = await db
    .select({ id: biolinks.id })
    .from(biolinks)
    .where(and(eq(biolinks.customDomain, normalizedDomain), ne(biolinks.id, biolinkId)))

  if (existingResult.length > 0) {
    return { success: false, error: 'DOMAIN_ALREADY_TAKEN' }
  }

  const verificationToken = generateVerificationToken()

  await db
    .update(biolinks)
    .set({
      customDomain: normalizedDomain,
      domainVerificationToken: verificationToken,
      domainOwnershipVerified: false,
      cnameVerified: false,
      updatedAt: new Date(),
    })
    .where(eq(biolinks.id, biolinkId))

  return { success: true, domain: normalizedDomain, verificationToken }
}

export async function removeCustomDomain(userId: string, biolinkId: string): Promise<RemoveDomainResult> {
  const biolinkResult = await db
    .select({
      id: biolinks.id,
      customDomain: biolinks.customDomain,
      domainOwnershipVerified: biolinks.domainOwnershipVerified,
    })
    .from(biolinks)
    .where(and(eq(biolinks.id, biolinkId), eq(biolinks.userId, userId)))

  if (biolinkResult.length === 0) {
    return { success: false, error: 'BIOLINK_NOT_FOUND' }
  }

  if (!biolinkResult[0].customDomain) {
    return { success: false, error: 'DOMAIN_NOT_SET' }
  }

  if (biolinkResult[0].domainOwnershipVerified) {
    const netlifyResult = await removeDomainAlias(biolinkResult[0].customDomain)
    if (!netlifyResult.success) {
      return { success: false, error: 'NETLIFY_ERROR' }
    }
  }

  await db
    .update(biolinks)
    .set({
      customDomain: null,
      domainVerificationToken: null,
      domainOwnershipVerified: false,
      cnameVerified: false,
      updatedAt: new Date(),
    })
    .where(eq(biolinks.id, biolinkId))

  return { success: true }
}

export async function verifyDomainOwnership(userId: string, biolinkId: string): Promise<VerifyOwnershipResult> {
  const biolinkResult = await db
    .select({
      id: biolinks.id,
      customDomain: biolinks.customDomain,
      domainVerificationToken: biolinks.domainVerificationToken,
    })
    .from(biolinks)
    .where(and(eq(biolinks.id, biolinkId), eq(biolinks.userId, userId)))

  if (biolinkResult.length === 0) {
    return { success: false, error: 'BIOLINK_NOT_FOUND' }
  }

  if (!biolinkResult[0].customDomain) {
    return { success: false, error: 'DOMAIN_NOT_SET' }
  }

  const domain = biolinkResult[0].customDomain
  const expectedToken = biolinkResult[0].domainVerificationToken

  try {
    const verificationHost = `_biolinq-verify.${domain}`
    const txtRecords = await dns.resolveTxt(verificationHost)

    const allRecords = txtRecords.flat()
    const tokenFound = allRecords.includes(expectedToken ?? '')

    if (!tokenFound) {
      return { success: true, verified: false }
    }

    const netlifyResult = await addDomainAlias(domain)
    if (!netlifyResult.success) {
      return { success: false, error: 'NETLIFY_ERROR' }
    }

    await db
      .update(biolinks)
      .set({
        domainOwnershipVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(biolinks.id, biolinkId))

    return { success: true, verified: true }
  } catch {
    return { success: true, verified: false }
  }
}

export async function verifyCNAME(userId: string, biolinkId: string): Promise<VerifyCNAMEResult> {
  const biolinkResult = await db
    .select({
      id: biolinks.id,
      customDomain: biolinks.customDomain,
      domainOwnershipVerified: biolinks.domainOwnershipVerified,
    })
    .from(biolinks)
    .where(and(eq(biolinks.id, biolinkId), eq(biolinks.userId, userId)))

  if (biolinkResult.length === 0) {
    return { success: false, error: 'BIOLINK_NOT_FOUND' }
  }

  if (!biolinkResult[0].customDomain) {
    return { success: false, error: 'DOMAIN_NOT_SET' }
  }

  if (!biolinkResult[0].domainOwnershipVerified) {
    return { success: false, error: 'OWNERSHIP_NOT_VERIFIED' }
  }

  try {
    const cnameRecords = await dns.resolveCname(biolinkResult[0].customDomain)

    const pointsToBiolinq = cnameRecords.some(
      (record) => record.replace(/\.$/, '').toLowerCase() === 'biolinq.page'
    )

    if (pointsToBiolinq) {
      await db
        .update(biolinks)
        .set({
          cnameVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(biolinks.id, biolinkId))

      return { success: true, verified: true }
    }

    return { success: true, verified: false }
  } catch {
    return { success: true, verified: false }
  }
}

export async function getBiolinkByCustomDomain(domain: string): Promise<ResolveDomainResult> {
  const normalizedDomain = domain.toLowerCase().trim()

  const result = await db
    .select({
      id: biolinks.id,
      username: biolinks.username,
      theme: biolinks.theme,
      customPrimaryColor: biolinks.customPrimaryColor,
      customBgColor: biolinks.customBgColor,
      customGa4TrackingId: biolinks.customGa4TrackingId,
      userName: users.name,
      userImage: users.image,
      userIsPremium: users.isPremium,
    })
    .from(biolinks)
    .innerJoin(users, eq(biolinks.userId, users.id))
    .where(
      and(
        eq(biolinks.customDomain, normalizedDomain),
        eq(biolinks.domainOwnershipVerified, true),
        eq(biolinks.cnameVerified, true)
      )
    )
    .limit(1)

  if (result.length === 0) {
    return { success: false }
  }

  const row = result[0]
  return {
    success: true,
    biolink: {
      id: row.id,
      username: row.username,
      theme: row.theme,
      customPrimaryColor: row.customPrimaryColor,
      customBgColor: row.customBgColor,
      customGa4TrackingId: row.customGa4TrackingId,
    },
    user: {
      name: row.userName,
      image: row.userImage,
      isPremium: row.userIsPremium,
    },
  }
}
