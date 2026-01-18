import { redirect } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { useLoaderData } from 'react-router'
import { getCurrentUser } from '~/lib/auth.server'
import { NeoBrutalCard } from '~/components/neo-brutal'

export async function loader({ request }: LoaderFunctionArgs) {
  const authSession = await getCurrentUser(request)

  if (!authSession?.user) {
    return redirect('/auth/login')
  }

  return { user: authSession.user }
}

export default function DashboardPage() {
  const { user } = useLoaderData<typeof loader>()

  return (
    <div className="min-h-screen bg-neo-input/30">
      <main className="max-w-4xl mx-auto px-4 py-16">
        <NeoBrutalCard>
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
            <p className="text-gray-700 font-mono">Coming soon in Phase 2...</p>
            <p className="text-sm text-gray-700 mt-4">Logged in as: {user.email}</p>
          </div>
        </NeoBrutalCard>
      </main>
    </div>
  )
}
