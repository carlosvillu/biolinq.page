import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from './schema'

let pgPool: pg.Pool | null = null
let dbInstance: ReturnType<typeof drizzle> | null = null

function getDatabaseUrl(): string {
  // DB_TEST_URL tiene prioridad (usado por E2E tests con TestContainers)
  const url = process.env.DB_TEST_URL || process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  return url
}

function getDb() {
  if (!dbInstance) {
    const databaseUrl = getDatabaseUrl()
    pgPool = new pg.Pool({ connectionString: databaseUrl })
    dbInstance = drizzle({ client: pgPool, schema })
  }
  return dbInstance
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const instance = getDb()
    const value = instance[prop as keyof ReturnType<typeof drizzle>]
    if (typeof value === 'function') {
      return value.bind(instance)
    }
    return value
  },
})

export async function checkDbConnection(): Promise<boolean> {
  const instance = getDb()
  const result = await instance.execute('SELECT 1 as check')
  if (result.rows && result.rows.length > 0) {
    return true
  }
  throw new Error('Database connection failed')
}

export { schema }
