import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('health/db', 'routes/health.db.tsx'),
  route('api/auth/*', 'routes/api.auth.$.tsx'),
  route('auth/signup', 'routes/auth.signup.tsx'),
  route('auth/login', 'routes/auth.login.tsx'),
] satisfies RouteConfig
