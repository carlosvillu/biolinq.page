# Database Setup

This project uses **PostgreSQL** as the database with Drizzle ORM for schema management and queries.

## Database Environments

| Environment     | Connection Variable | Usage                   |
| --------------- | ------------------- | ----------------------- |
| **Development** | `DATABASE_URL`      | `npm run dev`           |
| **Production**  | `DATABASE_URL`      | Production deployment   |
| **E2E Tests**   | `DB_TEST_URL`       | TestContainers (Docker) |

## Environment Variables

| Variable        | Purpose                                      | Used By                    |
| --------------- | -------------------------------------------- | -------------------------- |
| `DATABASE_URL`  | PostgreSQL connection string                 | Dev/Production             |
| `DB_TEST_URL`   | TestContainers connection string (priority)  | E2E tests only             |
| `DB_ENV`        | Selects `.env` file for Drizzle commands     | `db:migrate`, `db:generate`|

**Priority:** `DB_TEST_URL` > `DATABASE_URL`

## Database Driver

The app uses the standard `pg` (node-postgres) driver for all environments:

- **Development/Production:** Connects via `DATABASE_URL`
- **E2E Tests:** Connects via `DB_TEST_URL` (TestContainers)

Both work seamlessly with Drizzle ORM.

## Database Commands

```bash
npm run db:generate              # Generate migrations from schema changes
npm run db:migrate               # Run migrations (uses .env.development)
DB_ENV=production npm run db:migrate  # Run migrations against production
```

## Health Check Endpoint

`/health/db` returns:
- `ok` (200) - Database connection successful
- `error: <message>` (500) - Connection failed

Used by E2E tests to verify the server is connected to the correct database.

## Rules (MUST FOLLOW)

1. **Use `DB_ENV` for Drizzle commands** - NOT `NODE_ENV`
2. **E2E tests use `DB_TEST_URL`** - See `docs/TESTING.md` for details
3. **Always run migrations before deploying schema changes**
