import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('health/db', 'routes/health.db.tsx'),
  route('api/auth/*', 'routes/api.auth.$.tsx'),
  route('api/username/check', 'routes/api.username.check.tsx'),
  route('api/username/claim', 'routes/api.username.claim.tsx'),
  route('api/stripe/checkout', 'routes/api.stripe.checkout.tsx'),
  route('api/stripe/webhook', 'routes/api.stripe.webhook.tsx'),
  route('api/__test__/username', 'routes/api.__test__.username.tsx'),
  route('api/__test__/links', 'routes/api.__test__.links.tsx'),
  route('api/__test__/theme', 'routes/api.__test__.theme.tsx'),
  route('api/__test__/analytics', 'routes/api.__test__.analytics.tsx'),
  route('api/__test__/premium', 'routes/api.__test__.premium.tsx'),
  route('api/px', 'routes/api.px.tsx'),
  route('auth/login', 'routes/auth.login.tsx'),
  route('dashboard', 'routes/dashboard.tsx'),
  route('go/:linkId', 'routes/go.$linkId.tsx'),
  route(':username', 'routes/public.tsx'),
] satisfies RouteConfig
