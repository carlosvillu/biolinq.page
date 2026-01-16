import { redirect } from 'react-router'
import { auth } from './auth'
import type { Session, User } from './auth'

export type AuthSession = {
  session: Session
  user: User
}

export async function getCurrentUser(
  request: Request
): Promise<AuthSession | null> {
  const sessionData = await auth.api.getSession({
    headers: request.headers,
  })

  if (sessionData?.session && sessionData?.user) {
    return {
      session: sessionData.session,
      user: sessionData.user,
    }
  }

  return null
}

export async function requireAuth(request: Request): Promise<AuthSession> {
  const authSession = await getCurrentUser(request)

  if (!authSession) {
    const currentPath = new URL(request.url).pathname
    const redirectUrl = `/auth/login?redirect=${encodeURIComponent(currentPath)}`
    throw redirect(redirectUrl)
  }

  return authSession
}
