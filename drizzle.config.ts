import { defineConfig } from 'drizzle-kit'
import dotenv from 'dotenv'

// Load environment based on DB_ENV (NOT NODE_ENV) per docs/DATABASE.md
const dbEnv = process.env.DB_ENV || 'development'
const envFile = dbEnv === 'production' ? '.env.production' : '.env.development'

dotenv.config({ path: envFile })

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error(`DATABASE_URL is not set. Check your ${envFile} file.`)
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './app/db/schema/**/*.ts',
  out: './drizzle',
  dbCredentials: {
    url: databaseUrl,
  },
})
