import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '~/components/ui/dropdown-menu'
import { ThemeToggle } from '~/components/ThemeToggle'

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
          aria-label="User menu"
        >
          {/* Avatar: always visible */}
          <div className="w-8 h-8 rounded-full bg-ink text-paper flex items-center justify-center text-xs font-medium">
            {initials}
          </div>

          {/* Email: desktop only */}
          <span className="hidden md:block text-sm text-slate truncate max-w-[150px]">
            {user.email}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[200px]">
        {/* Email completo */}
        <div className="px-3 py-2 border-b border-silver">
          <p className="text-sm text-graphite truncate">{user.email}</p>
        </div>

        {/* Theme toggle */}
        <div className="px-3 py-2 flex items-center justify-between">
          <span className="text-sm">{t('theme_label')}</span>
          <ThemeToggle />
        </div>

        <DropdownMenuSeparator />

        {/* Link a dashboard (solo si es podcaster) */}
        {user.role === 'podcaster' && (
          <DropdownMenuItem asChild>
            <Link to="/dashboard" className="cursor-pointer">
              Dashboard
            </Link>
          </DropdownMenuItem>
        )}

        {/* Logout */}
        <DropdownMenuItem onClick={onLogout} className="cursor-pointer">
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
