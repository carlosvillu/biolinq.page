import { useTranslation } from 'react-i18next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Button } from '~/components/ui/button'
import { changeLanguage } from '~/lib/i18n.client'
import { DEFAULT_LOCALE, isValidLocale, type Locale } from '~/lib/i18n'

const LANGUAGE_OPTIONS: { locale: Locale; flag: string; label: string }[] = [
  { locale: 'en', flag: '🇬🇧', label: 'English' },
  { locale: 'es', flag: '🇪🇸', label: 'Español' },
]

export function LanguageSelector() {
  const { i18n } = useTranslation()
  const currentLocale = isValidLocale(i18n.language) ? i18n.language : DEFAULT_LOCALE

  const currentOption =
    LANGUAGE_OPTIONS.find((opt) => opt.locale === currentLocale) || LANGUAGE_OPTIONS[0]

  const handleSelect = (locale: Locale) => {
    changeLanguage(locale)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="h-9 px-3 text-sm font-medium text-slate hover:text-ink hover:bg-pearl transition-all"
        >
          <span className="mr-1.5">{currentOption.flag}</span>
          <span className="uppercase">{currentLocale}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {LANGUAGE_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.locale}
            onClick={() => handleSelect(option.locale)}
            className="cursor-pointer"
          >
            <span className="mr-2">{option.flag}</span>
            <span>{option.label}</span>
            {currentLocale === option.locale && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
