import { useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { NeoBrutalCard } from '~/components/neo-brutal'
import { GoogleAuthButton } from '~/components/GoogleAuthButton'

export default function LoginPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()

  return (
    <div className="min-h-screen bg-neo-canvas flex items-center justify-center px-4">
      <NeoBrutalCard className="w-full max-w-md">
        <h1 className="text-2xl font-bold tracking-tight mb-6 text-center">{t('login_title')}</h1>
        <GoogleAuthButton callbackURL={searchParams.get('redirect') || '/'} />
      </NeoBrutalCard>
    </div>
  )
}
