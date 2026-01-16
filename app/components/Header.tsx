import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { authClient } from '~/lib/auth.client'
import { Button } from '~/components/ui/button'
import { LanguageSelector } from '~/components/LanguageSelector'
import { UserDropdown } from '~/components/UserDropdown'
import type { Session, User } from '~/lib/auth'

type HeaderProps = {
  session: Session | null
  user: User | null
}

export function Header({ session, user }: HeaderProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await authClient.signOut()
    navigate('/')
  }

  return (
    <header className="fixed top-0 w-full z-50 bg-paper/90 backdrop-blur-sm border-b border-silver">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="font-serif text-2xl italic tracking-tight">
          [PROJECT_NAME]
        </Link>

        {/* Auth Section */}
        <div className="flex items-center gap-3">
          {session && user ? (
            <UserDropdown user={user} onLogout={handleLogout} />
          ) : (
            <Button
              asChild
              size="sm"
              className="px-5 py-2.5 bg-ink text-paper font-medium text-sm hover:bg-graphite transition-colors"
            >
              <Link to="/auth/login">{t('login')}</Link>
            </Button>
          )}
          <LanguageSelector />
        </div>
      </div>
    </header>
  )
}
