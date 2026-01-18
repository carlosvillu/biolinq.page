import { Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  NeoBrutalMenuRoot,
  NeoBrutalMenuTrigger,
  NeoBrutalMenuPopup,
  NeoBrutalMenuRadioGroup,
  NeoBrutalMenuRadioItem,
} from '~/components/neo-brutal'
import { changeLanguage } from '~/lib/i18n.client'
import { DEFAULT_LOCALE, isValidLocale, type Locale } from '~/lib/i18n'

const LANGUAGE_OPTIONS: { locale: Locale; label: string }[] = [
  { locale: 'en', label: 'English' },
  { locale: 'es', label: 'Español' },
]

export function LanguageSelector() {
  const { i18n } = useTranslation()
  const currentLocale = isValidLocale(i18n.language) ? i18n.language : DEFAULT_LOCALE

  const handleSelect = (locale: string) => {
    changeLanguage(locale as Locale)
  }

  return (
    <NeoBrutalMenuRoot>
      <div className="isolate relative group inline-block">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 rounded bg-neo-dark translate-x-1 translate-y-1 transition-transform duration-200 ease-out group-hover:translate-x-2 group-hover:translate-y-2"
        />
        <NeoBrutalMenuTrigger
          aria-label="Select language"
          className="relative z-10 flex items-center justify-center p-2 border-[3px] border-neo-dark rounded bg-white text-neo-dark transition-transform duration-200 ease-out group-hover:-translate-x-px group-hover:-translate-y-px group-hover:bg-neo-panel"
        >
          <Globe className="h-4 w-4" />
        </NeoBrutalMenuTrigger>
      </div>
      <NeoBrutalMenuPopup>
        <NeoBrutalMenuRadioGroup value={currentLocale} onValueChange={handleSelect}>
          {LANGUAGE_OPTIONS.map((option) => (
            <NeoBrutalMenuRadioItem key={option.locale} value={option.locale}>
              {option.label}
            </NeoBrutalMenuRadioItem>
          ))}
        </NeoBrutalMenuRadioGroup>
      </NeoBrutalMenuPopup>
    </NeoBrutalMenuRoot>
  )
}
