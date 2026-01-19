import { type LoaderFunctionArgs, type MetaFunction, data } from 'react-router'
import { useLoaderData, isRouteErrorResponse, useRouteError } from 'react-router'
import { getBiolinkWithUserByUsername } from '~/services/username.server'
import { getPublicLinksByBiolinkId } from '~/services/links.server'
import { trackView } from '~/services/views.server'
import { parseViewCookie, shouldTrackView, updateViewCookie } from '~/lib/view-cookie.server'
import { PublicProfile } from '~/components/public/PublicProfile'
import { PublicNotFound } from '~/components/public/PublicNotFound'
import { PublicError } from '~/components/public/PublicError'

export const handle = { hideLayout: true }

export async function loader({ params, request }: LoaderFunctionArgs) {
  const username = params.username

  if (!username) {
    throw new Response('Not Found', { status: 404 })
  }

  const result = await getBiolinkWithUserByUsername(username)

  if (!result) {
    throw new Response('Not Found', { status: 404 })
  }

  const url = new URL(request.url)
  const isPreview = url.searchParams.get('preview') === '1'

  const cookieHeader = request.headers.get('Cookie')
  const entries = parseViewCookie(cookieHeader)
  const shouldTrack = !isPreview && shouldTrackView(entries, result.biolink.id)

  const headers = new Headers()
  if (shouldTrack) {
    try {
      await trackView(result.biolink.id)
      const setCookieHeader = updateViewCookie(entries, result.biolink.id)
      headers.set('Set-Cookie', setCookieHeader)
    } catch {
      // Tracking failure should not block page render
    }
  }

  const links = await getPublicLinksByBiolinkId(result.biolink.id)

  return data(
    {
      biolink: result.biolink,
      user: result.user,
      links,
      isPreview,
    },
    { headers }
  )
}

export const meta: MetaFunction<typeof loader> = ({ data, error }) => {
  if (error || !data) {
    return [{ title: 'Profile not found | BioLinq' }, { name: 'robots', content: 'noindex' }]
  }

  const userName = data.user.name ?? data.biolink.username
  const description = `Check out ${userName}'s links on BioLinq`
  const avatarUrl = data.user.image ?? 'https://biolinq.page/default-avatar.png'
  const pageUrl = `https://biolinq.page/${data.biolink.username}`

  return [
    { title: `${userName} | BioLinq` },
    { name: 'description', content: description },

    { property: 'og:title', content: userName },
    { property: 'og:description', content: description },
    { property: 'og:image', content: avatarUrl },
    { property: 'og:url', content: pageUrl },
    { property: 'og:type', content: 'profile' },

    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: userName },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: avatarUrl },

    { tagName: 'link', rel: 'canonical', href: pageUrl },
  ]
}

export default function PublicPage() {
  const data = useLoaderData<typeof loader>()

  return (
    <PublicProfile
      user={data.user}
      biolink={data.biolink}
      links={data.links}
      isPreview={data.isPreview}
    />
  )
}

export function ErrorBoundary() {
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <PublicNotFound />
  }

  return <PublicError />
}
