import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('health/db', 'routes/health.db.tsx'),
  route('api/auth/*', 'routes/api.auth.$.tsx'),
  route('api/username/check', 'routes/api.username.check.tsx'),
  route('api/username/claim', 'routes/api.username.claim.tsx'),
  route('api/__test__/username', 'routes/api.__test__.username.tsx'),
  route('api/__test__/links', 'routes/api.__test__.links.tsx'),
  route('auth/login', 'routes/auth.login.tsx'),
  route('dashboard', 'routes/dashboard.tsx'),
] satisfies RouteConfig
