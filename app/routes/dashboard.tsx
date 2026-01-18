import { redirect } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { useLoaderData } from 'react-router'
import { getCurrentUser } from '~/lib/auth.server'
import { getUserBiolink } from '~/services/username.server'
import { getLinksByBiolinkId } from '~/services/links.server'
import {
  PremiumBanner,
  StatsCard,
  LinksEditorPlaceholder,
  PhonePreview,
} from '~/components/dashboard'

export async function loader({ request }: LoaderFunctionArgs) {
  const authSession = await getCurrentUser(request)

  if (!authSession?.user) {
    return redirect('/auth/login')
  }

  const biolink = await getUserBiolink(authSession.user.id)

  if (!biolink) {
    return redirect('/')
  }

  const linksResult = await getLinksByBiolinkId(
    authSession.user.id,
    biolink.id
  )
  const links = linksResult.success ? linksResult.links : []

  return {
    user: authSession.user,
    session: authSession.session,
    biolink,
    links,
  }
}

export default function DashboardPage() {
  const { user, biolink, links } = useLoaderData<typeof loader>()

  return (
    <div className="min-h-screen bg-neo-input/30">
      {!user.isPremium && <PremiumBanner />}

      <main className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-[1.5fr_1fr] gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          <StatsCard totalViews={biolink.totalViews} isPremium={user.isPremium} />
          <LinksEditorPlaceholder linkCount={links.length} />
        </div>

        {/* Right Column (hidden on mobile) */}
        <PhonePreview
          userName={user.name}
          userImage={user.image}
          links={links}
        />
      </main>
    </div>
  )
}
