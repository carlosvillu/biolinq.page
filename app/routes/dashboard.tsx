import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router'
import { useLoaderData, useActionData } from 'react-router'
import { getCurrentUser } from '~/lib/auth.server'
import { getUserBiolink } from '~/services/username.server'
import { getLinksByBiolinkId, createLink, deleteLink, reorderLinks } from '~/services/links.server'
import { getMaxLinks } from '~/lib/constants'
import {
  PremiumBanner,
  StatsOverview,
  DailyChart,
  LinkPerformance,
  LinksList,
  LivePreview,
  CustomizationSection,
  CustomDomainSection,
  GA4Settings,
} from '~/components/dashboard'
import { useUpgradeTracking } from '~/hooks/useUpgradeTracking'
import { useUserPropertiesTracking } from '~/hooks/useUserPropertiesTracking'
import { updateBiolinkTheme, updateBiolinkColors } from '~/services/theme.server'
import { updateGA4MeasurementId } from '~/services/ga4.server'
import { THEMES } from '~/lib/themes'
import type { BiolinkTheme } from '~/db/schema/biolinks'
import { getBasicStats, getPremiumStats, getLast7DaysData } from '~/services/analytics.server'
import { fillMissingDays, getLast7Days } from '~/lib/stats'
import {
  setCustomDomain,
  removeCustomDomain,
  verifyDomainOwnership,
  verifyCNAME,
} from '~/services/custom-domain.server'
import { invalidateBiolinkCache } from '~/services/cache.server'

export const meta: MetaFunction = () => {
  return [
    { title: 'Dashboard | BioLinq' },
    { name: 'robots', content: 'noindex, nofollow' },
  ]
}

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

  const basicStatsResult = await getBasicStats(biolink.id, authSession.user.id)
  const totalViews = basicStatsResult.success ? basicStatsResult.data.totalViews : 0

  let totalClicks: number | null = null
  let linksBreakdown: {
    linkId: string
    title: string
    emoji: string | null
    totalClicks: number
  }[] = []
  let dailyData: { date: string; views: number; clicks: number }[] = []

  if (authSession.user.isPremium) {
    const premiumStatsResult = await getPremiumStats(biolink.id, authSession.user.id)
    if (premiumStatsResult.success) {
      totalClicks = premiumStatsResult.data.totalClicks
      linksBreakdown = premiumStatsResult.data.linksBreakdown
    }

    const dailyDataResult = await getLast7DaysData(biolink.id, authSession.user.id)
    if (dailyDataResult.success) {
      dailyData = dailyDataResult.data
    }
  }

  return {
    user: authSession.user,
    session: authSession.session,
    biolink,
    links,
    stats: {
      totalViews,
      totalClicks,
      linksBreakdown,
      dailyData: fillMissingDays(dailyData, getLast7Days()),
    },
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const authSession = await getCurrentUser(request)

  if (!authSession?.user) {
    return redirect('/auth/login')
  }

  const biolink = await getUserBiolink(authSession.user.id)

  if (!biolink) {
    return redirect('/')
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

    invalidateBiolinkCache(biolink.username)
    return redirect('/dashboard')
  }

  if (intent === 'delete') {
    const linkId = formData.get('linkId') as string

    const result = await deleteLink(authSession.user.id, linkId)

    if (!result.success) {
      return data({ error: result.error })
    }

    invalidateBiolinkCache(biolink.username)
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

    invalidateBiolinkCache(biolink.username)
    return redirect('/dashboard')
  }

  if (intent === 'updateTheme') {
    const biolinkId = formData.get('biolinkId') as string
    const theme = formData.get('theme') as string
    const primaryColor = formData.get('primaryColor') as string | null
    const bgColor = formData.get('bgColor') as string | null

    if (!theme || !(theme in THEMES)) {
      return data({ error: 'INVALID_THEME' })
    }

    const themeResult = await updateBiolinkTheme(biolinkId, theme as BiolinkTheme)
    if (!themeResult.success) {
      return data({ error: themeResult.error })
    }

    const colorsResult = await updateBiolinkColors(biolinkId, {
      primaryColor: primaryColor || null,
      bgColor: bgColor || null,
    })

    if (!colorsResult.success) {
      return data({ error: colorsResult.error })
    }

    invalidateBiolinkCache(biolink.username)
    return redirect('/dashboard')
  }

  if (intent === 'setCustomDomain') {
    const domain = formData.get('domain') as string
    const biolinkId = formData.get('biolinkId') as string

    const result = await setCustomDomain(authSession.user.id, biolinkId, domain)

    if (!result.success) {
      return data({ error: result.error })
    }

    return data({ success: true, verificationToken: result.verificationToken })
  }

  if (intent === 'removeCustomDomain') {
    const biolinkId = formData.get('biolinkId') as string

    const result = await removeCustomDomain(authSession.user.id, biolinkId)

    if (!result.success) {
      return data({ error: result.error })
    }

    return redirect('/dashboard')
  }

  if (intent === 'verifyDomainOwnership') {
    const biolinkId = formData.get('biolinkId') as string

    const result = await verifyDomainOwnership(authSession.user.id, biolinkId)

    if (!result.success) {
      return data({ error: result.error })
    }

    return data({ ownershipVerified: result.verified })
  }

  if (intent === 'verifyCNAME') {
    const biolinkId = formData.get('biolinkId') as string

    const result = await verifyCNAME(authSession.user.id, biolinkId)

    if (!result.success) {
      return data({ error: result.error })
    }

    return data({ cnameVerified: result.verified })
  }

  if (intent === 'updateGA4') {
    const biolinkId = formData.get('biolinkId') as string
    const ga4MeasurementId = formData.get('ga4MeasurementId') as string

    // Convert empty string to null
    const normalizedId = ga4MeasurementId.trim() || null

    const result = await updateGA4MeasurementId(
      biolinkId,
      authSession.user.id,
      normalizedId
    )

    if (!result.success) {
      return data({ error: result.error })
    }

    invalidateBiolinkCache(biolink.username)
    return redirect('/dashboard')
  }

  return data({ error: 'UNKNOWN_INTENT' })
}

export default function DashboardPage() {
  const { user, biolink, links, stats } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>() as { error: string } | undefined

  useUpgradeTracking()
  useUserPropertiesTracking({
    isPremium: user.isPremium,
    hasBiolink: true,
    linkCount: links.length,
  })

  const maxLinks = getMaxLinks(user.isPremium)

  return (
    <div className="min-h-screen bg-neo-input/30">
      {!user.isPremium && <PremiumBanner />}

      <main className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-[1.5fr_1fr] gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Stats Section */}
          <div className="space-y-4">
            <StatsOverview
              totalViews={stats.totalViews}
              totalClicks={stats.totalClicks}
              isPremium={user.isPremium}
            />
            <DailyChart data={stats.dailyData} isPremium={user.isPremium} />
            <LinkPerformance links={stats.linksBreakdown} isPremium={user.isPremium} />
          </div>
          <LinksList
            links={links}
            biolinkId={biolink.id}
            maxLinks={maxLinks}
            error={actionData?.error}
          />
          <CustomizationSection
            currentTheme={biolink.theme}
            customPrimaryColor={biolink.customPrimaryColor}
            customBgColor={biolink.customBgColor}
            biolinkId={biolink.id}
            isPremium={user.isPremium}
          />
          <CustomDomainSection
            biolinkId={biolink.id}
            customDomain={biolink.customDomain}
            domainVerificationToken={biolink.domainVerificationToken}
            domainOwnershipVerified={biolink.domainOwnershipVerified ?? false}
            cnameVerified={biolink.cnameVerified ?? false}
            isPremium={user.isPremium}
          />
          <GA4Settings
            biolinkId={biolink.id}
            ga4MeasurementId={biolink.ga4MeasurementId}
            isPremium={user.isPremium}
          />
        </div>

        {/* Right Column (hidden on mobile) */}
        <LivePreview username={biolink.username} />
      </main>
    </div>
  )
}
