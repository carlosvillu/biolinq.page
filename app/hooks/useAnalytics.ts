import {
  trackSignup,
  trackUsernameCreated,
  trackLinkAdded,
  trackLinkDeleted,
  trackLinkClicked,
  trackLinksReordered,
  trackThemeChanged,
  trackThemeColorsChanged,
  trackPremiumCTAClicked,
  trackProfileViewed,
  trackCustomDomainSet,
  trackCustomDomainVerified,
  trackCustomDomainRemoved,
  trackLanguageChanged,
  setLanguageProperty,
} from '~/lib/analytics-events'

export function useAnalytics() {
  return {
    trackSignup,
    trackUsernameCreated,
    trackLinkAdded,
    trackLinkDeleted,
    trackLinkClicked,
    trackLinksReordered,
    trackThemeChanged,
    trackThemeColorsChanged,
    trackPremiumCTAClicked,
    trackProfileViewed,
    trackCustomDomainSet,
    trackCustomDomainVerified,
    trackCustomDomainRemoved,
    trackLanguageChanged,
    setLanguageProperty,
  }
}
