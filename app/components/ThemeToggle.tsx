import { Sun, Moon, Monitor } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '~/components/ThemeContext'
import {
  NeoBrutalMenuRoot,
  NeoBrutalMenuTrigger,
  NeoBrutalMenuPopup,
  NeoBrutalMenuItem,
} from '~/components/neo-brutal'
import type { ThemePreference } from '~/lib/theme'

export function ThemeToggle() {
  const { t } = useTranslation()
  const { preference, setTheme } = useTheme()

  const handleThemeChange = (newPreference: ThemePreference) => {
    setTheme(newPreference)
  }

  const getIcon = () => {
    switch (preference) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      case 'system':
        return <Monitor className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  return (
    <NeoBrutalMenuRoot>
      <div className="isolate relative group inline-block">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 rounded bg-neo-dark translate-x-1 translate-y-1 transition-transform duration-200 ease-out group-hover:translate-x-2 group-hover:translate-y-2"
        />
        <NeoBrutalMenuTrigger
          aria-label={t('theme_label')}
          className="relative z-10 flex items-center justify-center p-2 border-[3px] border-neo-dark rounded bg-white text-neo-dark transition-transform duration-200 ease-out group-hover:-translate-x-px group-hover:-translate-y-px group-hover:bg-neo-panel"
        >
          {getIcon()}
        </NeoBrutalMenuTrigger>
      </div>
      <NeoBrutalMenuPopup>
        <NeoBrutalMenuItem onClick={() => handleThemeChange('light')}>
          <Sun className="mr-2 h-4 w-4" />
          {t('theme_light')}
        </NeoBrutalMenuItem>
        <NeoBrutalMenuItem onClick={() => handleThemeChange('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          {t('theme_dark')}
        </NeoBrutalMenuItem>
        <NeoBrutalMenuItem onClick={() => handleThemeChange('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          {t('theme_system')}
        </NeoBrutalMenuItem>
      </NeoBrutalMenuPopup>
    </NeoBrutalMenuRoot>
  )
}
