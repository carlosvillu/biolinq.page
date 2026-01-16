import { HeroSection, Footer } from '~/components/landing'
import type { LoaderFunctionArgs } from 'react-router'
import { getCurrentUser } from '~/lib/auth.server'

export function meta() {
  return [
    { title: '[PROJECT_NAME]' },
    {
      name: 'description',
      content: '[PROJECT_DESCRIPTION]',
    },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const authSession = await getCurrentUser(request)
  return { user: authSession?.user ?? null }
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <Footer />
    </div>
  )
}
