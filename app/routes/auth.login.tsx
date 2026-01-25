import { useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { NeoBrutalCard } from '~/components/neo-brutal'
import { GoogleAuthButton } from '~/components/GoogleAuthButton'

function getSafeRedirectUrl(redirect: string | null): string {
  if (!redirect) return '/'
  // Only allow relative paths starting with / but not // (protocol-relative URLs)
  if (redirect.startsWith('/') && !redirect.startsWith('//')) {
    return redirect
  }
  return '/'
}

export default function LoginPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const safeRedirect = getSafeRedirectUrl(searchParams.get('redirect'))

  return (
    <div className="min-h-screen bg-neo-canvas flex items-center justify-center px-4">
      <NeoBrutalCard className="w-full max-w-md">
        <h1 className="text-2xl font-bold tracking-tight mb-6 text-center">{t('login_title')}</h1>
        <GoogleAuthButton callbackURL={safeRedirect} />
      </NeoBrutalCard>
    </div>
  )
}
