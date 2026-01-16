import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { Client, type QueryResult } from 'pg'

export type DbContext = {
  connectionString: string
  container: StartedPostgreSqlContainer
  client: Client
}

export async function startPostgresContainer(): Promise<DbContext> {
  const container = new PostgreSqlContainer('pgvector/pgvector:pg16')
  const startedContainer = await container.start()
  const connectionString = startedContainer.getConnectionUri()
  const client = new Client({ connectionString })
  await client.connect()
  return { connectionString, container: startedContainer, client }
}

export async function stopPostgresContainer(ctx: DbContext): Promise<void> {
  await ctx.client.end()
  await ctx.container.stop()
}

export async function executeSQL(
  ctx: DbContext,
  sql: string,
  params?: unknown[]
): Promise<QueryResult> {
  return await ctx.client.query(sql, params)
}

export async function resetDatabase(ctx: DbContext): Promise<void> {
  const result = await executeSQL(
    ctx,
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
  )
  if (result.rows.length > 0) {
    const tableNames = result.rows.map((r) => r.tablename).join(', ')
    await executeSQL(ctx, `TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`)
  }
}
