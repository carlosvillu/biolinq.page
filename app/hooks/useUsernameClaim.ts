import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { signIn, authClient } from '~/lib/auth.client'
import { createUsernameSchema } from '~/lib/username-validation'

const useSession = typeof window !== 'undefined' ? authClient.useSession : () => ({ data: null })

type ClaimState = 'idle' | 'checking' | 'claiming' | 'redirecting'

type ClaimError = {
  type: 'validation' | 'availability' | 'server'
  message: string
}

type CheckAvailabilityResponse =
  | { available: true }
  | { available: false; reason: 'USERNAME_TAKEN' | 'USERNAME_RESERVED' }

type ClaimResponse =
  | { success: true }
  | {
      success: false
      error: 'USERNAME_TAKEN' | 'USERNAME_RESERVED' | 'USER_ALREADY_HAS_BIOLINK'
    }

const toErrorKey = (code: string) => `username_error_${code.toLowerCase()}`

export function useUsernameClaim() {
  const [username, setUsername] = useState('')
  const [state, setState] = useState<ClaimState>('idle')
  const [error, setError] = useState<ClaimError | null>(null)
  const { data: session } = useSession()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const schema = useMemo(() => createUsernameSchema(t), [t])

  const handleUsernameChange = useCallback((value: string) => {
    setUsername(value.toLowerCase())
    setError(null)
  }, [])

  const handleClaim = useCallback(async () => {
    const parsed = schema.safeParse(username)
    if (!parsed.success) {
      setError({ type: 'validation', message: parsed.error.issues[0]?.message ?? '' })
      return
    }

    const normalizedUsername = parsed.data
    setState('checking')

    try {
      const availabilityResponse = await fetch(
        `/api/username/check?username=${encodeURIComponent(normalizedUsername)}`
      )

      if (!availabilityResponse.ok) {
        setError({ type: 'server', message: t('username_error_server') })
        setState('idle')
        return
      }

      const availability = (await availabilityResponse.json()) as CheckAvailabilityResponse

      if (!availability.available) {
        setError({
          type: 'availability',
          message: t(toErrorKey(availability.reason)),
        })
        setState('idle')
        return
      }

      if (session?.user) {
        setState('claiming')
        const claimResponse = await fetch('/api/username/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: normalizedUsername }),
        })

        if (!claimResponse.ok) {
          setError({ type: 'server', message: t('username_error_server') })
          setState('idle')
          return
        }

        const claimResult = (await claimResponse.json()) as ClaimResponse

        if (claimResult.success) {
          setState('redirecting')
          navigate('/dashboard')
          return
        }

        setError({ type: 'server', message: t(toErrorKey(claimResult.error)) })
        setState('idle')
        return
      }

      setState('redirecting')
      await signIn.social({
        provider: 'google',
        callbackURL: `/?username=${encodeURIComponent(normalizedUsername)}&claim=true`,
      })
    } catch {
      setError({ type: 'server', message: t('username_error_server') })
      setState('idle')
    }
  }, [navigate, schema, session, t, username])

  return {
    username,
    setUsername: handleUsernameChange,
    handleClaim,
    state,
    error,
    isLoggedIn: Boolean(session?.user),
  }
}
