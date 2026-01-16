import { executeSQL, type DbContext } from '../helpers/db'
import { FIXTURES } from './data'

/**
 * Create auth schema (users, accounts, sessions, verifications tables)
 */
export async function createAuthSchema(ctx: DbContext): Promise<void> {
  // Create users table
  await executeSQL(
    ctx,
    `CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      email_verified BOOLEAN DEFAULT false,
      image TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    )`
  )

  // Create accounts table (for Better Auth)
  await executeSQL(
    ctx,
    `CREATE TABLE IF NOT EXISTS accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      account_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      access_token_expires_at TIMESTAMP,
      refresh_token_expires_at TIMESTAMP,
      scope TEXT,
      id_token TEXT,
      password TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    )`
  )

  // Create sessions table
  await executeSQL(
    ctx,
    `CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    )`
  )

  // Create verifications table
  await executeSQL(
    ctx,
    `CREATE TABLE IF NOT EXISTS verifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    )`
  )
}

/**
 * Seed a user from fixtures
 */
export async function seedUser(
  ctx: DbContext,
  key: keyof typeof FIXTURES.users,
  overrides?: Partial<typeof FIXTURES.users.alice>
): Promise<string> {
  const data = { ...FIXTURES.users[key], ...overrides }
  const emailLowercase = data.email.toLowerCase()
  const result = await executeSQL(
    ctx,
    `INSERT INTO users (email, name)
     VALUES ($1, $2)
     RETURNING id`,
    [emailLowercase, data.name]
  )
  return result.rows[0].id
}

/**
 * Seed a session from fixtures
 */
export async function seedSession(
  ctx: DbContext,
  key: keyof typeof FIXTURES.sessions,
  relations: { userId: string },
  overrides?: Partial<typeof FIXTURES.sessions.aliceSession>
): Promise<string> {
  const data = { ...FIXTURES.sessions[key], ...overrides }
  const result = await executeSQL(
    ctx,
    `INSERT INTO sessions (user_id, token, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [relations.userId, data.token, data.expiresAt]
  )
  return result.rows[0].id
}

/**
 * Seed an account from fixtures
 */
export async function seedAccount(
  ctx: DbContext,
  key: keyof typeof FIXTURES.accounts,
  relations: { userId: string },
  overrides?: Partial<typeof FIXTURES.accounts.aliceAccount>
): Promise<string> {
  const data = { ...FIXTURES.accounts[key], ...overrides }
  const result = await executeSQL(
    ctx,
    `INSERT INTO accounts (user_id, account_id, provider_id, password)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [relations.userId, data.accountId, data.providerId, data.password]
  )
  return result.rows[0].id
}
