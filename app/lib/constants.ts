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

export const MAX_LINKS_FREE = 5
export const MAX_LINKS_PREMIUM = 5

export const getMaxLinks = (isPremium: boolean): number => {
  return isPremium ? MAX_LINKS_PREMIUM : MAX_LINKS_FREE
}
