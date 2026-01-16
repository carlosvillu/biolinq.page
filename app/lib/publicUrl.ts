export function buildPublicPodcastUrl(publicSlug: string, origin?: string): string {
  const safeSlug = String(publicSlug || '').trim()

  const resolvedOrigin = origin ?? getRuntimeOrigin()
  if (!resolvedOrigin) {
    return `/p/${safeSlug}`
  }

  return `${resolvedOrigin}/p/${safeSlug}`
}

function getRuntimeOrigin(): string | null {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }

  const fromEnv = process.env.BETTER_AUTH_URL
  if (fromEnv && typeof fromEnv === 'string') {
    return fromEnv.replace(/\/$/, '')
  }

  return null
}
