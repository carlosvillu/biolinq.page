const NETLIFY_API_BASE = 'https://api.netlify.com/api/v1'
const NETLIFY_API_TOKEN = process.env.NETLIFY_API_TOKEN
const NETLIFY_SITE_ID = process.env.NETLIFY_SITE_ID

export type NetlifyError = 'API_ERROR' | 'UNAUTHORIZED' | 'RATE_LIMITED' | 'NETWORK_ERROR' | 'NOT_CONFIGURED'

export type GetSiteResult =
  | { success: true; domainAliases: string[] }
  | { success: false; error: NetlifyError }

export type UpdateDomainsResult =
  | { success: true }
  | { success: false; error: NetlifyError }

export async function getCurrentDomainAliases(): Promise<GetSiteResult> {
  if (!NETLIFY_API_TOKEN || !NETLIFY_SITE_ID) {
    return { success: false, error: 'NOT_CONFIGURED' }
  }

  try {
    const response = await fetch(`${NETLIFY_API_BASE}/sites/${NETLIFY_SITE_ID}`, {
      headers: {
        Authorization: `Bearer ${NETLIFY_API_TOKEN}`,
      },
    })

    if (response.status === 401) {
      return { success: false, error: 'UNAUTHORIZED' }
    }
    if (response.status === 429) {
      return { success: false, error: 'RATE_LIMITED' }
    }
    if (!response.ok) {
      return { success: false, error: 'API_ERROR' }
    }

    const data = (await response.json()) as { domain_aliases?: string[] }
    return { success: true, domainAliases: data.domain_aliases ?? [] }
  } catch {
    return { success: false, error: 'NETWORK_ERROR' }
  }
}

export async function updateDomainAliases(newAliases: string[]): Promise<UpdateDomainsResult> {
  if (!NETLIFY_API_TOKEN || !NETLIFY_SITE_ID) {
    return { success: false, error: 'NOT_CONFIGURED' }
  }

  try {
    const response = await fetch(`${NETLIFY_API_BASE}/sites/${NETLIFY_SITE_ID}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${NETLIFY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ domain_aliases: newAliases }),
    })

    if (response.status === 401) {
      return { success: false, error: 'UNAUTHORIZED' }
    }
    if (response.status === 429) {
      return { success: false, error: 'RATE_LIMITED' }
    }
    if (!response.ok) {
      return { success: false, error: 'API_ERROR' }
    }

    return { success: true }
  } catch {
    return { success: false, error: 'NETWORK_ERROR' }
  }
}

export async function addDomainAlias(domain: string): Promise<UpdateDomainsResult> {
  const currentResult = await getCurrentDomainAliases()
  if (!currentResult.success) {
    return currentResult
  }

  if (currentResult.domainAliases.includes(domain)) {
    return { success: true }
  }

  const newList = [...currentResult.domainAliases, domain]
  return await updateDomainAliases(newList)
}

export async function removeDomainAlias(domain: string): Promise<UpdateDomainsResult> {
  const currentResult = await getCurrentDomainAliases()
  if (!currentResult.success) {
    return currentResult
  }

  const newList = currentResult.domainAliases.filter((d) => d !== domain)

  if (newList.length === currentResult.domainAliases.length) {
    return { success: true }
  }

  return await updateDomainAliases(newList)
}
