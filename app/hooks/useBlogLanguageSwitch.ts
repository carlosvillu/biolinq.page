import { useMatches } from 'react-router'

interface BlogLanguageSwitch {
  isBlogPage: boolean
  getLanguageSwitchUrl: ((newLocale: string) => string) | null
}

export function useBlogLanguageSwitch(): BlogLanguageSwitch {
  const matches = useMatches()

  const blogPostMatch = matches.find((m) => m.id === 'routes/blog.post')
  const blogIndexMatch = matches.find((m) => m.id === 'routes/blog.index')

  if (blogPostMatch) {
    const matchData = blogPostMatch.data as {
      translationSlugs?: Record<string, string | null>
    } | undefined

    const translationSlugs = matchData?.translationSlugs

    return {
      isBlogPage: true,
      getLanguageSwitchUrl: (newLocale: string) => {
        const targetSlug = translationSlugs?.[newLocale]
        if (targetSlug) return `/blog/${newLocale}/${targetSlug}`
        return `/blog/${newLocale}`
      },
    }
  }

  if (blogIndexMatch) {
    return {
      isBlogPage: true,
      getLanguageSwitchUrl: (newLocale: string) => `/blog/${newLocale}`,
    }
  }

  return { isBlogPage: false, getLanguageSwitchUrl: null }
}
