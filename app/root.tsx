import { useEffect } from 'react'
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  data,
  useMatches,
} from 'react-router'
import { I18nextProvider } from 'react-i18next'
import { type i18n } from 'i18next'

import type { Route } from './+types/root'
import './app.css'
import { Header } from '~/components/Header'
import {
  detectLocale,
  parseLangCookie,
  createLangCookie,
  createI18nInstance,
  type Locale,
  DEFAULT_LOCALE,
} from '~/lib/i18n'
import { initI18nClientSync, getI18nInstance } from '~/lib/i18n.client'
import { auth } from '~/lib/auth'
import { GoogleAnalytics } from '~/components/GoogleAnalytics'
import { usePageviewTracking } from '~/hooks/usePageviewTracking'
import { NeoBrutalToastProvider } from '~/components/neo-brutal/NeoBrutalToast'
import { ThemeProvider } from '~/components/ThemeContext'
import { getThemeCookie, getThemeInitScript } from '~/lib/theme'
import { Footer } from '~/components/landing'

export const links: Route.LinksFunction = () => [
  // Basic Favicons
  { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/web/favicon-16x16.png' },
  { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/web/favicon-32x32.png' },
  { rel: 'icon', type: 'image/png', sizes: '48x48', href: '/web/favicon-48x48.png' },
  // iOS - Add to Home Screen
  { rel: 'apple-touch-icon', sizes: '180x180', href: '/ios/apple-touch-icon.png' },
  // Android & PWA
  { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/android/icon-192.png' },
  { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/android/icon-512.png' },
  { rel: 'manifest', href: '/manifest.json' },
  // Fonts
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap',
  },
]

// Server-side i18n instance cache (per-request in production)
let serverI18nInstance: i18n | null = null

export async function loader({ request }: Route.LoaderArgs) {
  const cookieHeader = request.headers.get('Cookie')
  const langCookie = parseLangCookie(cookieHeader)
  const locale = detectLocale(request, langCookie)
  const themePreference = getThemeCookie(cookieHeader)

  // Get session from server
  const sessionData = await auth.api.getSession({
    headers: request.headers,
  })

  // Create i18n instance for SSR
  serverI18nInstance = await createI18nInstance(locale)

  const gaMeasurementId = process.env.GA_MEASUREMENT_ID || undefined
  const nodeEnv = process.env.NODE_ENV || 'development'

  const response = {
    locale,
    session: sessionData?.session ?? null,
    user: sessionData?.user ?? null,
    themePreference,
    gaMeasurementId,
    nodeEnv,
  }

  // Set cookie if it doesn't exist or differs from detected locale
  if (!langCookie || langCookie !== locale) {
    return data(response, { headers: { 'Set-Cookie': createLangCookie(locale) } })
  }

  return response
}

export function getServerI18nInstance(): i18n | null {
  return serverI18nInstance
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffc480" />
        <meta name="msapplication-TileImage" content="/windows/mstile-150x150.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <Meta />
        <Links />
        {/* Theme init script must run synchronously before body renders to prevent FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: getThemeInitScript(),
          }}
        />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

// Client-side i18n instance (initialized once on first render)
let clientI18nInstance: i18n | null = null

function getI18nInstanceForRender(locale: Locale): i18n | null {
  if (typeof window === 'undefined') {
    // Server: use the instance created in the loader
    return serverI18nInstance
  }
  // Client: initialize once and reuse
  if (!clientI18nInstance) {
    initI18nClientSync(locale)
    clientI18nInstance = getI18nInstance()
  } else if (clientI18nInstance.language !== locale) {
    // Sync language if it differs (e.g., after navigation with different locale)
    clientI18nInstance.changeLanguage(locale)
  }
  return clientI18nInstance
}

export default function App({ loaderData }: Route.ComponentProps) {
  const locale = (loaderData?.locale ?? DEFAULT_LOCALE) as Locale
  const themePreference = loaderData?.themePreference ?? null
  const i18nInstance = getI18nInstanceForRender(locale)
  const gaMeasurementId = loaderData?.gaMeasurementId
  const nodeEnv = loaderData?.nodeEnv ?? 'development'

  usePageviewTracking(gaMeasurementId)

  const matches = useMatches()
  const hideLayout = matches.some(
    (match) =>
      (match.handle as { hideLayout?: boolean } | undefined)?.hideLayout ||
      (match.data as { hideLayout?: boolean } | undefined)?.hideLayout
  )

  // Update html lang attribute when locale changes
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  // Handle language changes after initial render
  useEffect(() => {
    if (typeof window !== 'undefined' && i18nInstance) {
      i18nInstance.changeLanguage(locale)
    }
  }, [locale, i18nInstance])

  if (!i18nInstance) {
    // Fallback during SSR if loader hasn't run yet (shouldn't happen normally)
    return (
      <NeoBrutalToastProvider>
        <ThemeProvider initialPreference={themePreference}>
          <GoogleAnalytics measurementId={gaMeasurementId} nodeEnv={nodeEnv} />
          {hideLayout ? (
            <Outlet />
          ) : (
            <div className="min-h-screen flex flex-col bg-neo-canvas">
              <Header session={loaderData?.session ?? null} user={loaderData?.user ?? null} />
              <main className="flex-1">
                <Outlet />
              </main>
              <Footer />
            </div>
          )}
        </ThemeProvider>
      </NeoBrutalToastProvider>
    )
  }

  return (
    <NeoBrutalToastProvider>
      <ThemeProvider initialPreference={themePreference}>
        <GoogleAnalytics measurementId={gaMeasurementId} nodeEnv={nodeEnv} />
        <I18nextProvider i18n={i18nInstance}>
          {hideLayout ? (
            <Outlet />
          ) : (
            <div className="min-h-screen flex flex-col bg-neo-canvas">
              <Header session={loaderData.session} user={loaderData.user} />
              <main className="flex-1">
                <Outlet />
              </main>
              <Footer />
            </div>
          )}
        </I18nextProvider>
      </ThemeProvider>
    </NeoBrutalToastProvider>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error'
    details =
      error.status === 404 ? 'The requested page could not be found.' : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
