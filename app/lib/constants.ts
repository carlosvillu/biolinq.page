export const RESERVED_USERNAMES: readonly string[] = [
  'admin',
  'api',
  'www',
  'app',
  'dashboard',
  'login',
  'signup',
  'settings',
  'premium',
  'help',
  'support',
  'terms',
  'privacy',
  'go',
  'about',
  'contact',
  'blog',
  'pricing',
  'static',
  'assets',
  'public',
  'auth',
  'account',
  'profile',
]

export const isReservedUsername = (username: string): boolean =>
  RESERVED_USERNAMES.includes(username.toLowerCase())
