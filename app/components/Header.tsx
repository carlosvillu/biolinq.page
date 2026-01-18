import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { authClient } from '~/lib/auth.client'
import { NeoBrutalButton } from '~/components/neo-brutal'
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
    <header className="sticky top-0 bg-neo-canvas border-b-[3px] border-neo-dark z-40">
      <div className="max-w-4xl mx-auto px-4 h-16 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1">
          <span className="text-2xl font-black tracking-tighter">Bio</span>
          <span className="text-2xl font-black text-neo-accent tracking-tighter">Linq</span>
          <span className="text-xs font-mono bg-neo-control px-1 border border-neo-dark ml-2">
            BETA
          </span>
        </Link>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {session && user ? (
            <UserDropdown user={user} onLogout={handleLogout} />
          ) : (
            <NeoBrutalButton variant="secondary" size="sm" asChild>
              <Link to="/auth/login">{t('login')}</Link>
            </NeoBrutalButton>
          )}
          <LanguageSelector />
        </div>
      </div>
    </header>
  )
}
