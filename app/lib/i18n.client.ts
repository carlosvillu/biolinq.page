import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '~/locales/en.json'
import es from '~/locales/es.json'
import { COOKIE_NAME, COOKIE_MAX_AGE, type Locale, DEFAULT_LOCALE, isValidLocale } from './i18n'

const resources = {
  en: { translation: en },
  es: { translation: es },
}

let initialized = false

/**
 * Initialize i18next synchronously for client-side hydration.
 * This must be called before React hydration to avoid mismatches.
 */
export function initI18nClientSync(initialLocale: Locale): void {
  if (initialized) {
    // If already initialized, just change language
    i18next.changeLanguage(initialLocale)
    return
  }

  i18next.use(initReactI18next).init({
    resources,
    lng: initialLocale,
    fallbackLng: DEFAULT_LOCALE,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    initImmediate: false, // Synchronous initialization
  })

  initialized = true
}

export async function initI18nClient(initialLocale: Locale): Promise<void> {
  if (initialized) {
    // If already initialized, just change language
    await i18next.changeLanguage(initialLocale)
    return
  }

  await i18next.use(initReactI18next).init({
    resources,
    lng: initialLocale,
    fallbackLng: DEFAULT_LOCALE,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })

  initialized = true
}

export function changeLanguage(newLocale: Locale): void {
  if (!isValidLocale(newLocale)) return

  // Update cookie
  document.cookie = `${COOKIE_NAME}=${newLocale}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`

  // Change i18next language (triggers re-render through react-i18next)
  i18next.changeLanguage(newLocale)
}

export function getCurrentLocale(): Locale {
  const lang = i18next.language
  return isValidLocale(lang) ? lang : DEFAULT_LOCALE
}

export function getI18nInstance() {
  return i18next
}
