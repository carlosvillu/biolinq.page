import acceptLanguage from 'accept-language-parser'
import i18next, { type i18n } from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '~/locales/en.json'
import es from '~/locales/es.json'

export const SUPPORTED_LOCALES = ['en', 'es'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'
export const COOKIE_NAME = 'lang'
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year in seconds

const resources = {
  en: { translation: en },
  es: { translation: es },
}

export function isValidLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale)
}

/**
 * Creates a new i18next instance for SSR.
 * Each request gets its own instance to avoid state pollution.
 */
export async function createI18nInstance(locale: Locale): Promise<i18n> {
  const instance = i18next.createInstance()

  await instance.use(initReactI18next).init({
    resources,
    lng: locale,
    fallbackLng: DEFAULT_LOCALE,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })

  return instance
}

export function detectLocale(request: Request, cookieValue?: string | null): Locale {
  // 1. Check cookie first
  if (cookieValue && isValidLocale(cookieValue)) {
    return cookieValue
  }

  // 2. Parse Accept-Language header
  const acceptLanguageHeader = request.headers.get('Accept-Language')
  if (acceptLanguageHeader) {
    const languages = acceptLanguage.parse(acceptLanguageHeader)
    for (const lang of languages) {
      const code = lang.code.toLowerCase()
      if (code.startsWith('es')) return 'es'
      if (code.startsWith('en')) return 'en'
    }
  }

  // 3. Default to English
  return DEFAULT_LOCALE
}

export function parseLangCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';').reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      if (key && value) {
        acc[key] = value
      }
      return acc
    },
    {} as Record<string, string>
  )

  return cookies[COOKIE_NAME] || null
}

export function createLangCookie(locale: Locale): string {
  return `${COOKIE_NAME}=${locale}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`
}
