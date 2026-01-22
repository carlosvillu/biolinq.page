const CLOUDFLARE_API_URL = 'https://api.cloudflare.com/client/v4'

export function invalidateBiolinkCache(biolinkId: string): void {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN

  if (!zoneId || !apiToken) {
    console.warn('[Cache] Cloudflare credentials not configured, skipping invalidation')
    return
  }

  const surrogateKey = `biolink-${biolinkId}`

  fetch(`${CLOUDFLARE_API_URL}/zones/${zoneId}/purge_cache`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prefixes: [surrogateKey],
    }),
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorBody = await response.text()
        console.error('[Cache] Cloudflare purge failed:', response.status, errorBody)
      } else {
        console.log('[Cache] Purged cache for:', surrogateKey)
      }
    })
    .catch((error) => {
      console.error('[Cache] Error purging cache:', error)
    })
}
