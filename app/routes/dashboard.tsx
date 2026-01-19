import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router'
import { useLoaderData, useActionData } from 'react-router'
import { getCurrentUser } from '~/lib/auth.server'
import { getUserBiolink } from '~/services/username.server'
import { getLinksByBiolinkId, createLink, deleteLink, reorderLinks } from '~/services/links.server'
import { getMaxLinks } from '~/lib/constants'
import { PremiumBanner, StatsCard, LinksList, LivePreview } from '~/components/dashboard'

export async function loader({ request }: LoaderFunctionArgs) {
  const authSession = await getCurrentUser(request)

  if (!authSession?.user) {
    return redirect('/auth/login')
  }

  const biolink = await getUserBiolink(authSession.user.id)

  if (!biolink) {
    return redirect('/')
  }

  const linksResult = await getLinksByBiolinkId(authSession.user.id, biolink.id)
  const links = linksResult.success ? linksResult.links : []

  return {
    user: authSession.user,
    session: authSession.session,
    biolink,
    links,
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const authSession = await getCurrentUser(request)

  if (!authSession?.user) {
    return redirect('/auth/login')
  }

  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'create') {
    const emoji = formData.get('emoji') as string | null
    const title = formData.get('title') as string
    const url = formData.get('url') as string
    const biolinkId = formData.get('biolinkId') as string

    const result = await createLink(authSession.user.id, biolinkId, {
      emoji: emoji || undefined,
      title,
      url,
    })

    if (!result.success) {
      return data({ error: result.error })
    }

    return redirect('/dashboard')
  }

  if (intent === 'delete') {
    const linkId = formData.get('linkId') as string

    const result = await deleteLink(authSession.user.id, linkId)

    if (!result.success) {
      return data({ error: result.error })
    }

    return redirect('/dashboard')
  }

  if (intent === 'reorder') {
    const biolinkId = formData.get('biolinkId') as string
    const linkIdsRaw = formData.get('linkIds') as string

    let linkIds: string[]
    try {
      linkIds = JSON.parse(linkIdsRaw)
    } catch {
      return data({ error: 'INVALID_LINK_IDS' })
    }

    const result = await reorderLinks(authSession.user.id, biolinkId, linkIds)

    if (!result.success) {
      return data({ error: result.error })
    }

    return redirect('/dashboard')
  }

  return data({ error: 'UNKNOWN_INTENT' })
}

export default function DashboardPage() {
  const { user, biolink, links } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>() as { error: string } | undefined

  const maxLinks = getMaxLinks(user.isPremium)

  return (
    <div className="min-h-screen bg-neo-input/30">
      {!user.isPremium && <PremiumBanner />}

      <main className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-[1.5fr_1fr] gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          <StatsCard totalViews={biolink.totalViews} isPremium={user.isPremium} />
          <LinksList
            links={links}
            biolinkId={biolink.id}
            maxLinks={maxLinks}
            error={actionData?.error}
          />
        </div>

        {/* Right Column (hidden on mobile) */}
        <LivePreview username={biolink.username} />
      </main>
    </div>
  )
}
