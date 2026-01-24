function gtagEvent(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return
  }
  window.gtag('event', eventName, params)
}

// Auth events
export function trackSignup(): void {
  gtagEvent('sign_up', { method: 'google' })
}

// Username events
export function trackUsernameCreated(username: string): void {
  gtagEvent('username_created', { username })
}

// Link events
export function trackLinkAdded(): void {
  gtagEvent('link_added')
}

export function trackLinkDeleted(): void {
  gtagEvent('link_deleted')
}

export function trackLinkClicked(linkId: string, position: number): void {
  gtagEvent('link_clicked', { link_id: linkId, position })
}

export function trackLinksReordered(): void {
  gtagEvent('links_reordered')
}

// Theme events
export function trackThemeChanged(theme: string): void {
  gtagEvent('theme_changed', { theme })
}

export function trackThemeColorsChanged(): void {
  gtagEvent('theme_colors_changed')
}

// Premium events
export function trackPremiumCTAClicked(location: string): void {
  gtagEvent('premium_cta_clicked', { location })
}

// Ecommerce events (GA4 standard)
export function trackBeginCheckout(): void {
  gtagEvent('begin_checkout', {
    currency: 'EUR',
    value: 5.0,
    items: [{ item_name: 'BioLinq Premium', price: 5.0, quantity: 1 }],
  })
}

export function trackPurchase(transactionId: string): void {
  gtagEvent('purchase', {
    transaction_id: transactionId,
    value: 5.0,
    currency: 'EUR',
    items: [{ item_name: 'BioLinq Premium', price: 5.0, quantity: 1 }],
  })
}

// Profile events
export function trackProfileViewed(username: string): void {
  gtagEvent('profile_viewed', { username })
}

// Custom domain events
export function trackCustomDomainSet(domain: string): void {
  gtagEvent('custom_domain_set', { domain })
}

export function trackCustomDomainVerified(step: 'ownership' | 'cname'): void {
  gtagEvent('custom_domain_verified', { step })
}

export function trackCustomDomainRemoved(): void {
  gtagEvent('custom_domain_removed')
}

// Language events
export function trackLanguageChanged(language: string): void {
  gtagEvent('language_changed', { language })
}

export function setLanguageProperty(language: string): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return
  }
  window.gtag('set', 'user_properties', { language })
}
