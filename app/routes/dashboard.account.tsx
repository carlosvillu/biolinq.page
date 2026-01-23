import { redirect, data } from 'react-router'
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router'
import { useLoaderData, useActionData } from 'react-router'
import { getCurrentUser } from '~/lib/auth.server'
import { getUserBiolink } from '~/services/username.server'
import { deleteAccount } from '~/services/account.server'
import { AccountInfoCard } from '~/components/dashboard/AccountInfoCard'
import { DeleteAccountDialog } from '~/components/dashboard/DeleteAccountDialog'
import { Header } from '~/components/Header'

export async function loader({ request }: LoaderFunctionArgs) {
  const authSession = await getCurrentUser(request)

  // Redirect to login if not authenticated
  if (!authSession?.user || !authSession?.session) {
    return redirect('/auth/login')
  }

  // Get biolink information
  const biolink = await getUserBiolink(authSession.user.id)

  // Redirect to homepage if no biolink exists
  if (!biolink) {
    return redirect('/')
  }

  return {
    session: authSession.session,
    user: authSession.user,
    accountUser: {
      email: authSession.user.email,
      name: authSession.user.name,
      image: authSession.user.image ?? null,
      isPremium: authSession.user.isPremium,
      createdAt: authSession.user.createdAt,
    },
    biolink: {
      username: biolink.username,
      customDomain: biolink.customDomain,
    },
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const authSession = await getCurrentUser(request)

  // Redirect to login if not authenticated
  if (!authSession?.user) {
    return redirect('/auth/login')
  }

  const formData = await request.formData()
  const intent = formData.get('intent')

  // Handle deleteAccount intent
  if (intent === 'deleteAccount') {
    const result = await deleteAccount(authSession.user.id)

    if (!result.success) {
      return data(
        {
          error:
            result.error === 'NO_BIOLINK'
              ? 'No biolink found for this user'
              : 'Failed to delete account',
        },
        { status: 400 }
      )
    }

    // Account deleted successfully
    // Note: The session will be invalidated automatically by the database cascade delete
    // Redirect to landing page
    return redirect('/')
  }

  return data({ error: 'Invalid intent' }, { status: 400 })
}

export default function AccountPage() {
  const { session, user, accountUser, biolink } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()

  return (
    <div className="min-h-screen bg-neo-input/30">
      <Header session={session} user={user} />

      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-neo-dark mb-2">
            Account Settings
          </h1>
          <p className="text-gray-700">Manage your account information and settings</p>
        </div>

        {/* Error Message */}
        {actionData && 'error' in actionData && (
          <div className="mb-6 p-4 bg-neo-accent/10 border-[3px] border-neo-accent rounded text-neo-dark">
            <p className="font-medium">{actionData.error}</p>
          </div>
        )}

        {/* Account Info Card */}
        <div className="mb-8">
          <AccountInfoCard user={accountUser} biolink={biolink} />
        </div>

        {/* Delete Account Section */}
        <div className="border-t-[3px] border-neo-dark pt-8">
          <h2 className="text-xl font-bold text-neo-dark mb-2">Danger Zone</h2>
          <p className="text-gray-700 mb-4">
            Permanently delete your account and all associated data. This action cannot be
            undone.
          </p>
          <DeleteAccountDialog username={biolink.username} />
        </div>
      </main>
    </div>
  )
}
