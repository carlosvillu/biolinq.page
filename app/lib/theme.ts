// Theme types
export type Theme = 'light' | 'dark'
export type ThemePreference = 'light' | 'dark' | 'system'

// Cookie constants
const COOKIE_NAME = 'theme'
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 // 1 year in seconds

/**
 * Parse theme cookie from request headers
 */
export function getThemeCookie(cookieHeader: string | null): ThemePreference | null {
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';').reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      if (key && value) {
        acc[key] = value
      }
      return acc
    },
    {} as Record<string, string>,
  )

  const theme = cookies[COOKIE_NAME]
  if (theme === 'light' || theme === 'dark' || theme === 'system') {
    return theme
  }

  return null
}

/**
 * Create Set-Cookie header value for theme preference
 */
export function setThemeCookie(preference: ThemePreference): string {
  return `${COOKIE_NAME}=${preference}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

/**
 * Resolve theme preference to actual theme
 */
export function resolveTheme(
  preference: ThemePreference,
  systemPreference?: Theme,
): Theme {
  if (preference === 'system') {
    return systemPreference || 'light'
  }
  return preference
}

/**
 * Generate inline script to prevent FOUC (Flash Of Unstyled Content)
 * This script runs synchronously in <head> before body renders
 */
export function getThemeInitScript(): string {
  const script = `
    (function() {
      try {
        // Read theme cookie from browser
        var cookies = document.cookie.split(';').reduce(function(acc, cookie) {
          var parts = cookie.trim().split('=');
          if (parts[0] && parts[1]) {
            acc[parts[0]] = parts[1];
          }
          return acc;
        }, {});

        var preference = cookies.theme;

        // If no preference or system, detect from browser
        if (!preference || preference === 'system') {
          var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (isDark) {
            document.documentElement.classList.add('dark');
          }
        } else if (preference === 'dark') {
          document.documentElement.classList.add('dark');
        }
      } catch (e) {
        console.error('Theme init error:', e);
      }
    })();
  `
  return script
}
