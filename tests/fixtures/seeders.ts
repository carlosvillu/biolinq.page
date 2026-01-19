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
      is_premium BOOLEAN NOT NULL DEFAULT false,
      stripe_customer_id TEXT,
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

  // Create biolink_theme enum and biolinks table
  await executeSQL(
    ctx,
    `DO $$ BEGIN
      CREATE TYPE biolink_theme AS ENUM ('brutalist', 'light_minimal', 'dark_mode', 'colorful');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$`
  )

  await executeSQL(
    ctx,
    `CREATE TABLE IF NOT EXISTS biolinks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      username VARCHAR(20) NOT NULL UNIQUE,
      theme biolink_theme NOT NULL DEFAULT 'light_minimal',
      custom_primary_color VARCHAR(7),
      custom_bg_color VARCHAR(7),
      total_views INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    )`
  )

  await executeSQL(
    ctx,
    `CREATE INDEX IF NOT EXISTS idx_biolinks_username ON biolinks(username)`
  )

  // Create links table
  await executeSQL(
    ctx,
    `CREATE TABLE IF NOT EXISTS links (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      biolink_id UUID NOT NULL REFERENCES biolinks(id) ON DELETE CASCADE,
      emoji VARCHAR(10),
      title VARCHAR(50) NOT NULL,
      url TEXT NOT NULL,
      position INTEGER NOT NULL,
      total_clicks INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    )`
  )

  // Create daily_link_clicks table
  await executeSQL(
    ctx,
    `CREATE TABLE IF NOT EXISTS daily_link_clicks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
      date TIMESTAMP NOT NULL,
      clicks INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )`
  )

  await executeSQL(
    ctx,
    `CREATE UNIQUE INDEX IF NOT EXISTS unique_link_date ON daily_link_clicks(link_id, date)`
  )

  await executeSQL(
    ctx,
    `CREATE INDEX IF NOT EXISTS idx_daily_link_clicks_link_date ON daily_link_clicks(link_id, date)`
  )
}

/**
 * Seed a user from fixtures
 */
export async function seedUser(
  ctx: DbContext,
  key: keyof typeof FIXTURES.users,
  overrides?: Partial<typeof FIXTURES.users.alice & { isPremium?: boolean; image?: string }>
): Promise<string> {
  const data = { ...FIXTURES.users[key], ...overrides }
  const emailLowercase = data.email.toLowerCase()
  const nameValue = data.name === '' ? null : data.name
  const result = await executeSQL(
    ctx,
    `INSERT INTO users (email, name, is_premium, image)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [emailLowercase, nameValue, data.isPremium ?? false, data.image ?? null]
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

/**
 * Seed a biolink
 */
export async function seedBiolink(
  ctx: DbContext,
  data: {
    userId: string
    username: string
    theme?: 'brutalist' | 'light_minimal' | 'dark_mode' | 'colorful'
  }
): Promise<string> {
  const result = await executeSQL(
    ctx,
    `INSERT INTO biolinks (user_id, username, theme)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [data.userId, data.username, data.theme ?? 'light_minimal']
  )
  return result.rows[0].id
}

/**
 * Seed a link
 */
export async function seedLink(
  ctx: DbContext,
  data: {
    biolinkId: string
    emoji?: string
    title: string
    url: string
    position: number
  }
): Promise<string> {
  const result = await executeSQL(
    ctx,
    `INSERT INTO links (biolink_id, emoji, title, url, position)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [data.biolinkId, data.emoji ?? null, data.title, data.url, data.position]
  )
  return result.rows[0].id
}
