const CLOUDFLARE_API_URL = 'https://api.cloudflare.com/client/v4'
const SITE_URL = process.env.SITE_URL ?? 'https://biolinq.page'

export async function invalidateBiolinkCache(username: string): Promise<void> {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN

  if (!zoneId || !apiToken) {
    console.warn('[Cache] Cloudflare credentials not configured, skipping invalidation')
    return
  }

  const urlToPurge = `${SITE_URL}/${username}`

  try {
    const response = await fetch(`${CLOUDFLARE_API_URL}/zones/${zoneId}/purge_cache`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: [urlToPurge],
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('[Cache] Cloudflare purge failed:', response.status, errorBody)
    } else {
      console.log('[Cache] Purged cache for URL:', urlToPurge)
    }
  } catch (error) {
    console.error('[Cache] Error purging cache:', error)
  }
}
