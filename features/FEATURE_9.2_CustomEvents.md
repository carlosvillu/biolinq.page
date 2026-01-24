# FEATURE_9.2_CustomEvents

## 1. Natural Language Description

**Estado actual:** GA4 está integrado con tracking automático de page views (`usePageviewTracking` hook) y user properties de entorno. No hay tracking de eventos custom de interacción del usuario.

**Estado final:** Todos los puntos clave de interacción del usuario disparan eventos GA4 tipados: signup, username claim, link CRUD, theme changes, premium CTAs, profile views, link clicks, reorder, custom domain flow, y cambio de idioma. Un hook `useAnalytics()` expone funciones tipadas que los componentes consumen para disparar eventos.

## 2. Technical Description

- Crear un módulo `app/lib/analytics-events.ts` con funciones tipadas que llaman a `window.gtag('event', ...)`.
- Crear un hook `app/hooks/useAnalytics.ts` que expone las funciones del módulo como un wrapper type-safe (no-op si `window.gtag` no existe).
- Integrar llamadas al hook en los componentes/hooks existentes que manejan cada interacción.
- Enviar `language` como user property en GA4 y trackear el evento de cambio de idioma.
- NO se requieren E2E tests para esta tarea.

## 2.1. Architecture Gate

- **Pages are puzzles:** No se modifica UI de rutas. Solo se añaden llamadas a tracking en hooks/componentes existentes.
- **Loaders/actions are thin:** No se tocan loaders/actions.
- **Business logic is not in components:** El tracking es una concern cross-cutting que se implementa como hook (`useAnalytics`) consumido por componentes. No hay lógica de dominio involucrada.

## 3. Files to Change/Create

### `app/lib/analytics-events.ts`
**Objective:** Definir todas las funciones de eventos GA4 tipadas. Cada función llama a `window.gtag('event', eventName, params)` con type-safety. Si `window.gtag` no existe, es un no-op.

**Pseudocode:**
```pseudocode
// Guard helper
FUNCTION gtagEvent(eventName: string, params?: Record<string, unknown>)
  IF typeof window === 'undefined' OR typeof window.gtag !== 'function'
    RETURN
  END
  window.gtag('event', eventName, params)
END

// Auth events
FUNCTION trackSignup()
  gtagEvent('sign_up', { method: 'google' })
END

// Username events
FUNCTION trackUsernameCreated(username: string)
  gtagEvent('username_created', { username })
END

// Link events
FUNCTION trackLinkAdded()
  gtagEvent('link_added')
END

FUNCTION trackLinkDeleted()
  gtagEvent('link_deleted')
END

FUNCTION trackLinkClicked(linkId: string, position: number)
  gtagEvent('link_clicked', { link_id: linkId, position })
END

FUNCTION trackLinksReordered()
  gtagEvent('links_reordered')
END

// Theme events
FUNCTION trackThemeChanged(theme: string)
  gtagEvent('theme_changed', { theme })
END

FUNCTION trackThemeColorsChanged()
  gtagEvent('theme_colors_changed')
END

// Premium events
FUNCTION trackPremiumCTAClicked(location: string)
  gtagEvent('premium_cta_clicked', { location })
END

// Profile events
FUNCTION trackProfileViewed(username: string)
  gtagEvent('profile_viewed', { username })
END

// Custom domain events
FUNCTION trackCustomDomainSet(domain: string)
  gtagEvent('custom_domain_set', { domain })
END

FUNCTION trackCustomDomainVerified(step: 'ownership' | 'cname')
  gtagEvent('custom_domain_verified', { step })
END

FUNCTION trackCustomDomainRemoved()
  gtagEvent('custom_domain_removed')
END

// Language events
FUNCTION trackLanguageChanged(language: string)
  gtagEvent('language_changed', { language })
END

FUNCTION setLanguageProperty(language: string)
  IF typeof window === 'undefined' OR typeof window.gtag !== 'function'
    RETURN
  END
  window.gtag('set', 'user_properties', { language })
END
```

---

### `app/hooks/useAnalytics.ts`
**Objective:** Hook que expone todas las funciones de tracking como un objeto. Wrapper simple sobre analytics-events.ts.

**Pseudocode:**
```pseudocode
IMPORT all functions from '~/lib/analytics-events'

FUNCTION useAnalytics()
  RETURN {
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
END
```

**Nota:** El hook no tiene estado ni efectos. Es un wrapper para que los componentes lo usen de forma idiomática con React. Las funciones ya son no-op si gtag no existe.

---

### `app/hooks/useUsernameClaim.ts`
**Objective:** Añadir tracking de `trackUsernameCreated` cuando el claim es exitoso, y `trackSignup` cuando se redirige al OAuth flow.

**Pseudocode:**
```pseudocode
// Import useAnalytics
IMPORT { useAnalytics } from '~/hooks/useAnalytics'

// Inside useUsernameClaim:
CONST { trackUsernameCreated, trackSignup } = useAnalytics()

// After successful claim (claimResult.success === true):
trackUsernameCreated(normalizedUsername)

// Before signIn.social call (new user going to OAuth):
trackSignup()
```

---

### `app/components/dashboard/LinksList.tsx`
**Objective:** Añadir tracking cuando se reordenan links.

**Pseudocode:**
```pseudocode
// Import useAnalytics
IMPORT { useAnalytics } from '~/hooks/useAnalytics'

// Inside component:
CONST { trackLinksReordered } = useAnalytics()

// After successful drag-end that changes order:
trackLinksReordered()
```

---

### `app/components/dashboard/AddLinkDialog.tsx`
**Objective:** Añadir tracking cuando se crea un link exitosamente.

**Pseudocode:**
```pseudocode
// Import useAnalytics
IMPORT { useAnalytics } from '~/hooks/useAnalytics'

// Inside component:
CONST { trackLinkAdded } = useAnalytics()

// When wasSubmittingRef.current && navigation.state === 'idle' (successful submit):
trackLinkAdded()
```

---

### `app/components/dashboard/ThemeSelector.tsx`
**Objective:** Añadir tracking cuando el usuario cambia el tema.

**Pseudocode:**
```pseudocode
// Import useAnalytics
IMPORT { useAnalytics } from '~/hooks/useAnalytics'

// Inside component:
CONST { trackThemeChanged } = useAnalytics()

// When theme is selected (in onThemeChange callback):
trackThemeChanged(selectedTheme)
```

---

### `app/components/dashboard/CustomizationSection.tsx`
**Objective:** Añadir tracking cuando el usuario guarda colores custom.

**Pseudocode:**
```pseudocode
// Import useAnalytics
IMPORT { useAnalytics } from '~/hooks/useAnalytics'

// Inside component:
CONST { trackThemeColorsChanged } = useAnalytics()

// When custom colors are submitted (form submit for colors):
trackThemeColorsChanged()
```

---

### `app/components/dashboard/PremiumBanner.tsx`
**Objective:** Añadir tracking cuando el usuario hace click en el CTA de premium.

**Pseudocode:**
```pseudocode
// Import useAnalytics
IMPORT { useAnalytics } from '~/hooks/useAnalytics'

// Inside component:
CONST { trackPremiumCTAClicked } = useAnalytics()

// On form submit (Go Premium button click):
trackPremiumCTAClicked('dashboard_banner')
```

---

### `app/components/dashboard/CustomDomainSection.tsx`
**Objective:** Añadir tracking para el flujo de custom domain: configurar, verificar ownership, verificar CNAME, y eliminar.

**Pseudocode:**
```pseudocode
// Import useAnalytics
IMPORT { useAnalytics } from '~/hooks/useAnalytics'

// Inside component:
CONST { trackCustomDomainSet, trackCustomDomainVerified, trackCustomDomainRemoved } = useAnalytics()

// When setCustomDomain form is submitted successfully:
// Use useEffect watching fetcherData when intent was 'setCustomDomain' and no error:
trackCustomDomainSet(domainInput)

// When verifyDomainOwnership returns ownershipVerified=true:
trackCustomDomainVerified('ownership')

// When verifyCNAME returns cnameVerified=true:
trackCustomDomainVerified('cname')

// When removeCustomDomain is submitted:
trackCustomDomainRemoved()
```

---

### `app/hooks/usePageView.ts`
**Objective:** Añadir `trackProfileViewed` junto con el tracking existente de page view.

**Pseudocode:**
```pseudocode
// Import trackProfileViewed from analytics-events (direct import, not hook, since this is already a hook)
IMPORT { trackProfileViewed } from '~/lib/analytics-events'

// Inside the existing useEffect that fires the page view:
// After the fetch to /api/px:
trackProfileViewed(username)
```

**Nota:** Este hook necesita recibir `username` como parámetro adicional (o extraerlo del contexto existente).

---

### `app/components/public/PublicLinkCard.tsx`
**Objective:** Añadir tracking de click en link público.

**Pseudocode:**
```pseudocode
// Import useAnalytics
IMPORT { useAnalytics } from '~/hooks/useAnalytics'

// Inside component:
CONST { trackLinkClicked } = useAnalytics()

// On link click (onClick handler on the anchor):
trackLinkClicked(linkId, position)
```

**Nota:** El componente ya redirige a `/go/:linkId`. El tracking client-side se dispara antes del redirect. `position` es el índice del link en la lista (0-based).

---

### `app/components/LanguageSelector.tsx`
**Objective:** Añadir tracking de cambio de idioma.

**Pseudocode:**
```pseudocode
// Import useAnalytics
IMPORT { useAnalytics } from '~/hooks/useAnalytics'

// Inside component:
CONST { trackLanguageChanged } = useAnalytics()

// In handleSelect, after changeLanguage call:
trackLanguageChanged(locale)
```

---

### `app/hooks/usePageviewTracking.ts`
**Objective:** Enviar user property `language` junto con cada page view.

**Pseudocode:**
```pseudocode
// Import setLanguageProperty from analytics-events
IMPORT { setLanguageProperty } from '~/lib/analytics-events'
// Import useTranslation to get current language
IMPORT { useTranslation } from 'react-i18next'

// Inside the hook:
CONST { i18n } = useTranslation()

// In the existing useEffect, also call:
setLanguageProperty(i18n.language)
```

---

### `app/components/landing/PricingSection.tsx`
**Objective:** Añadir tracking del CTA de premium en la landing.

**Pseudocode:**
```pseudocode
// Import useAnalytics
IMPORT { useAnalytics } from '~/hooks/useAnalytics'

// Inside component:
CONST { trackPremiumCTAClicked } = useAnalytics()

// On premium CTA button click:
trackPremiumCTAClicked('landing_pricing')
```

---

### Dashboard link delete (archivo que maneja el delete)

**Nota:** El delete de links se maneja en `LinksList.tsx` o un componente hijo. Buscar dónde está el botón de delete con intent `delete` y añadir:

**Pseudocode:**
```pseudocode
// When delete is confirmed/submitted:
trackLinkDeleted()
```

---

## 4. I18N

No se requieren nuevas claves i18n. Esta tarea solo añade tracking invisible al usuario.

## 5. E2E Test Plan

No se requieren E2E tests para esta tarea (confirmado por el usuario). El tracking se verifica en producción con GA4 Real-Time reports.
