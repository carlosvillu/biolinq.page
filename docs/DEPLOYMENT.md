# Deployment

## Production Deployment

### Environment Variables (configure in your hosting platform)

- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Authentication secret (generate with `openssl rand -base64 32`)
- `BETTER_AUTH_URL` - Production URL (e.g., `https://your-app.com`)
- `GOOGLE_CLIENT_ID` - Google OAuth Client ID (optional, if using Google OAuth)
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret (optional, if using Google OAuth)

## Deploy Commands

### Example: Netlify

```bash
# Deploy to production
npm run deploy

# Deploy preview (for testing before production)
npm run deploy:preview

# If there are database schema changes, run migrations FIRST:
DB_ENV=production npm run db:migrate
npm run deploy
```

## Why Manual Migrations?

- Full control over schema changes
- Ability to review before applying
- Easy rollback if something goes wrong
- Avoids failed deploys due to migration errors

## Other Deployment Options

- **Docker:** A `Dockerfile` can be added for containerized deployment
- **Vercel/Cloudflare Pages:** Compatible with React Router SSR
- **VPS/Self-hosted:** Use `npm run build` and `npm run start`

## Common Issues

### Environment Variables Not Available

**Problem:** Environment variables marked as "secret" in some platforms may not be available in serverless function runtime.

**Solution:** Check your platform's documentation. Some platforms require specific configuration for secrets to be available at runtime.

### Migrations Not Applied in Production

**Problem:** Error `relation "X" does not exist` when trying to use the app in production.

**Cause:** Database migrations are only applied when explicitly run. The production database doesn't have the tables.

**Solution:** Always run migrations before the first deploy or when there are schema changes:

```bash
DB_ENV=production npm run db:migrate
npm run deploy
```

### Better Auth CORS Errors

**Problem:** CORS errors or authentication failures in production.

**Cause:** The production URL is not in the `trustedOrigins` list in `app/lib/auth.ts`.

**Solution:** Add your production URL to the `trustedOrigins` array:

```typescript
trustedOrigins: [
  'https://your-production-url.com',
  // ... other origins
],
```

### Google OAuth Redirect URI Errors

**Problem:** Google OAuth login fails with redirect URI error.

**Solution:** Add `https://your-production-url.com/api/auth/callback/google` to the **Authorized redirect URIs** in Google Cloud Console.
