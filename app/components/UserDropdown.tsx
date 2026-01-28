import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  NeoBrutalMenuRoot,
  NeoBrutalMenuTrigger,
  NeoBrutalMenuPopup,
  NeoBrutalMenuItem,
  NeoBrutalMenuSeparator,
} from '~/components/neo-brutal/NeoBrutalMenu'

type UserDropdownProps = {
  user: { email: string; role?: string | null }
  onLogout: () => void | Promise<void>
}

function getInitials(email: string): string {
  const name = email.split('@')[0]
  const parts = name.split(/[._-]/)

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }

  return name.slice(0, 2).toUpperCase()
}

export function UserDropdown({ user, onLogout }: UserDropdownProps) {
  const { t } = useTranslation()
  const initials = getInitials(user.email)

  return (
    <NeoBrutalMenuRoot>
      <NeoBrutalMenuTrigger>
        <div
          className="flex items-center gap-2 px-3 py-2 border-[3px] border-neo-dark rounded bg-white hover:bg-neo-panel transition-colors cursor-pointer"
          aria-label="User menu"
        >
          {/* Avatar: always visible */}
          <div className="w-6 h-6 rounded-full bg-neo-dark text-white flex items-center justify-center text-xs font-bold">
            {initials}
          </div>
        </div>
      </NeoBrutalMenuTrigger>

      <NeoBrutalMenuPopup>
        <div className="px-4 py-2 border-b-2 border-neo-dark">
          <p className="text-sm font-medium truncate">{user.email}</p>
        </div>
        {/* Link a dashboard */}
        <NeoBrutalMenuItem>
          <Link to="/dashboard" className="w-full">
            Dashboard
          </Link>
        </NeoBrutalMenuItem>

        {/* Link to Account */}
        <NeoBrutalMenuItem>
          <Link to="/dashboard/account" className="w-full">
            {t('account_page_link')}
          </Link>
        </NeoBrutalMenuItem>

        <NeoBrutalMenuSeparator />

        {/* Logout */}
        <NeoBrutalMenuItem onClick={onLogout}>{t('logout')}</NeoBrutalMenuItem>
      </NeoBrutalMenuPopup>
    </NeoBrutalMenuRoot>
  )
}
