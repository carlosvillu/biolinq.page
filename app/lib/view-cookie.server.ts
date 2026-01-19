import { parse, serialize } from 'cookie'

const COOKIE_NAME = '_blv'
const TTL_MINUTES = 30
const MAX_ENTRIES = 50

type ViewEntry = { biolinkId: string; timestamp: number }

export function parseViewCookie(cookieHeader: string | null): ViewEntry[] {
  if (!cookieHeader) return []

  const cookies = parse(cookieHeader)
  const rawValue = cookies[COOKIE_NAME]
  if (!rawValue) return []

  try {
    const entries = rawValue.split('|')
    return entries
      .map((entry: string) => {
        const [id, ts] = entry.split(':')
        return { biolinkId: id, timestamp: parseInt(ts, 10) }
      })
      .filter((e: ViewEntry) => e.biolinkId && !isNaN(e.timestamp))
  } catch {
    return []
  }
}

export function shouldTrackView(entries: ViewEntry[], biolinkId: string): boolean {
  const now = Date.now()
  const threshold = now - TTL_MINUTES * 60 * 1000

  const existingEntry = entries.find((e) => e.biolinkId === biolinkId)
  if (!existingEntry) return true

  return existingEntry.timestamp < threshold
}

export function updateViewCookie(entries: ViewEntry[], biolinkId: string): string {
  const now = Date.now()
  const threshold = now - TTL_MINUTES * 60 * 1000

  const filtered = entries.filter(
    (e) => e.timestamp >= threshold && e.biolinkId !== biolinkId
  )

  let newEntries = [...filtered, { biolinkId, timestamp: now }]

  if (newEntries.length > MAX_ENTRIES) {
    newEntries = newEntries.slice(-MAX_ENTRIES)
  }

  const value = newEntries.map((e) => `${e.biolinkId}:${e.timestamp}`).join('|')

  return serialize(COOKIE_NAME, value, {
    maxAge: 24 * 60 * 60,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  })
}
