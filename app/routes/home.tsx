import type { LoaderFunctionArgs } from 'react-router'
import { redirect, useLoaderData, data } from 'react-router'
import {
  BioLinqHero,
  ComparisonSection,
  FinalCTASection,
  PricingSection,
  ProblemSection,
  SocialProofSection,
  SolutionSection,
} from '~/components/landing'
import { getCurrentUser } from '~/lib/auth.server'
import { registerUsername, getUserBiolink } from '~/services/username.server'
import { getBiolinkByCustomDomain } from '~/services/custom-domain.server'
import { getPublicLinksByBiolinkId } from '~/services/links.server'
import { PublicProfile } from '~/components/public/PublicProfile'
import { trackView } from '~/services/views.server'
import { parseViewCookie, shouldTrackView, updateViewCookie } from '~/lib/view-cookie.server'

export function meta() {
  const title = 'BioLinq - Free Link in Bio Tool | Linktree Alternative'
  const description =
    'Create your free link in bio page in under 2 minutes. Ultra-fast, brutalist design. 4 themes, analytics, and only 5€ lifetime for premium.'
  const url = 'https://biolinq.page'
  const image = 'https://biolinq.page/og-image.jpg'

  return [
    { title },
    { name: 'description', content: description },

    // Open Graph
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: url },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: image },
    { property: 'og:site_name', content: 'BioLinq' },

    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:url', content: url },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },

    // Canonical
    { tagName: 'link', rel: 'canonical', href: url },
  ]
}

const MAIN_DOMAINS = ['biolinq.page', 'www.biolinq.page', 'localhost', '127.0.0.1']

function isCustomDomain(host: string): boolean {
  return !MAIN_DOMAINS.some((d) => host === d || host.startsWith(d + ':'))
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const host = url.host

  if (isCustomDomain(host)) {
    const customDomainResult = await getBiolinkByCustomDomain(host)
    if (customDomainResult.success) {
      const links = await getPublicLinksByBiolinkId(customDomainResult.biolink.id)

      const cookieHeader = request.headers.get('Cookie')
      const entries = parseViewCookie(cookieHeader)
      const shouldTrack = shouldTrackView(entries, customDomainResult.biolink.id)

      const headers = new Headers()
      if (shouldTrack) {
        try {
          await trackView(customDomainResult.biolink.id)
          const setCookieHeader = updateViewCookie(entries, customDomainResult.biolink.id)
          headers.set('Set-Cookie', setCookieHeader)
        } catch {
          // Tracking failure should not block page render
        }
      }

      return data(
        {
          renderType: 'profile' as const,
          biolink: customDomainResult.biolink,
          user: customDomainResult.user,
          links,
          isCustomDomain: true,
          hideLayout: true,
        },
        { headers }
      )
    }
    throw new Response('Not Found', { status: 404 })
  }

  const authSession = await getCurrentUser(request)

  if (authSession?.user) {
    const existingBiolink = await getUserBiolink(authSession.user.id)
    if (existingBiolink) {
      return redirect('/dashboard')
    }

    const usernameToClaim = url.searchParams.get('username')
    const shouldClaim = url.searchParams.get('claim') === 'true'

    if (usernameToClaim && shouldClaim) {
      const result = await registerUsername(
        authSession.user.id,
        usernameToClaim.toLowerCase().trim()
      )

      if (result.success) {
        return redirect('/dashboard')
      }

      return {
        renderType: 'landing' as const,
        user: authSession.user,
        claimError: result.error,
      }
    }
  }

  return { renderType: 'landing' as const, user: authSession?.user ?? null, claimError: null }
}

export default function Home() {
  const loaderData = useLoaderData<typeof loader>()

  if (loaderData.renderType === 'profile') {
    return (
      <PublicProfile
        user={loaderData.user}
        biolink={loaderData.biolink}
        links={loaderData.links}
        isPreview={false}
      />
    )
  }

  return (
    <div className="min-h-screen bg-neo-canvas flex flex-col">
      <BioLinqHero initialError={loaderData.claimError} />
      <ProblemSection />
      <SolutionSection />
      <ComparisonSection />
      <SocialProofSection />
      <PricingSection />
      <FinalCTASection />
    </div>
  )
}
