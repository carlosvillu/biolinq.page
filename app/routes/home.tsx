import type { LoaderFunctionArgs } from 'react-router'
import { redirect, useLoaderData } from 'react-router'
import { BioLinqHero } from '~/components/landing'
import { getCurrentUser } from '~/lib/auth.server'
import { registerUsername, getUserBiolink } from '~/services/username.server'

export function meta() {
  return [
    { title: 'BioLinq - The minimalist Linktree' },
    {
      name: 'description',
      content: 'Ultra-fast, brutalist design link-in-bio pages. Stand out by being simple.',
    },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const authSession = await getCurrentUser(request)

  if (authSession?.user) {
    const existingBiolink = await getUserBiolink(authSession.user.id)
    if (existingBiolink) {
      return redirect('/dashboard')
    }

    const url = new URL(request.url)
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

      return { user: authSession.user, claimError: result.error }
    }
  }

  return { user: authSession?.user ?? null, claimError: null }
}

export default function Home() {
  const data = useLoaderData<typeof loader>()

  return (
    <div className="min-h-screen bg-neo-canvas flex flex-col">
      <BioLinqHero initialError={data.claimError} />
    </div>
  )
}
