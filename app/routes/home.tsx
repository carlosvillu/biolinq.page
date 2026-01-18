import { BioLinqHero } from '~/components/landing'
import type { LoaderFunctionArgs } from 'react-router'
import { getCurrentUser } from '~/lib/auth.server'

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
  return { user: authSession?.user ?? null }
}

export default function Home() {
  return (
    <div className="min-h-screen bg-neo-canvas flex flex-col">
      <BioLinqHero />
    </div>
  )
}
