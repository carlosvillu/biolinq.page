# FEATURE_9.5_CONSENT_PRIVACY_COMPLIANCE.md

## ✅ IMPLEMENTATION STATUS: 100% COMPLETE

**Verificado en producción: Sin fallos ✅**

---

## 1. Natural Language Description

### Current State (Before)
Google Analytics 4 (GA4) se carga automáticamente en todas las páginas sin pedir consentimiento al usuario. El script `gtag.js` se inyecta en `root.tsx` a través del componente `GoogleAnalytics.tsx` siempre que exista `GA_MEASUREMENT_ID`. Esto puede violar GDPR y otras regulaciones de privacidad en la UE.

### Expected End State (After)
- Un banner de consentimiento de cookies aparece en la **parte inferior de la pantalla** para usuarios nuevos
- El banner ofrece dos opciones: **"Aceptar todo"** y **"Rechazar todo"**
- La preferencia se guarda en **localStorage** y persiste entre sesiones
- El script de GA4 (`gtag.js`) **NO se carga hasta que el usuario acepta**
- Si el usuario rechaza, GA4 nunca se carga y no se envían datos a Google
- El banner sigue el diseño **Neo-Brutal** consistente con el resto de la aplicación
- El banner está completamente **internacionalizado** (EN/ES)

---

## 2. Technical Description

### High-Level Approach
1. Crear un sistema de gestión de consentimiento basado en localStorage
2. Crear un componente de banner Neo-Brutal que aparece condicionalmente
3. Modificar el flujo de carga de GA4 para que sea condicional al consentimiento
4. El componente `GoogleAnalytics.tsx` solo renderiza scripts si hay consentimiento
5. Usar un hook personalizado para gestionar el estado de consentimiento

### Architecture Decisions
- **localStorage vs cookie**: Usamos localStorage porque es más simple, persiste indefinidamente, y no necesitamos el consentimiento server-side
- **No cargar script sin consentimiento**: Enfoque más estricto GDPR. El script gtag.js no se carga en absoluto hasta aceptar
- **Componente independiente**: El banner es un componente separado renderizado en root.tsx
- **Hook para acceso global**: `useConsent()` para que cualquier componente pueda verificar el estado

### Key Files Involved
- `app/hooks/useConsent.ts` - Hook de gestión de consentimiento (NUEVO)
- `app/components/CookieConsentBanner.tsx` - Componente del banner (NUEVO)
- `app/components/GoogleAnalytics.tsx` - Modificar para respetar consentimiento
- `app/root.tsx` - Integrar banner y pasar estado de consentimiento
- `app/locales/en.json` y `app/locales/es.json` - Nuevas claves i18n

---

## 2.1. Architecture Gate

- **Pages are puzzles:** `root.tsx` solo compone `CookieConsentBanner` y `GoogleAnalytics` sin lógica de negocio.
- **Loaders/actions are thin:** No se requieren loaders/actions para esta feature (todo es client-side).
- **Business logic is not in components:**
  - Lógica de consentimiento (leer/escribir localStorage, verificar estado) vive en **`app/hooks/useConsent.ts`**
  - `CookieConsentBanner` solo renderiza UI y llama funciones del hook
  - `GoogleAnalytics` recibe una prop `hasConsent` y decide si renderizar scripts

### Verification
- **Route module (`root.tsx`):** Compone `CookieConsentBanner` + `GoogleAnalytics`, pasa props
- **Component (`CookieConsentBanner`):** Usa `useConsent` hook, renderiza UI, no tiene lógica de persistencia
- **Hook (`useConsent`):** Gestiona localStorage, expone `consent`, `acceptAll()`, `rejectAll()`

---

## 3. Files to Change/Create

### `app/hooks/useConsent.ts` (NEW)

**Objective:** Hook que gestiona el estado de consentimiento de analytics. Lee/escribe localStorage. Expone estado y funciones para aceptar/rechazar.

**Pseudocode:**
```pseudocode
CONSTANT STORAGE_KEY = 'biolinq_analytics_consent'

TYPE ConsentState = 'pending' | 'accepted' | 'rejected'

HOOK useConsent
  STATE consent: ConsentState, initialized: boolean

  EFFECT (on mount, client-only):
    READ value from localStorage(STORAGE_KEY)
    IF value === 'accepted' THEN SET consent = 'accepted'
    ELSE IF value === 'rejected' THEN SET consent = 'rejected'
    ELSE SET consent = 'pending'
    SET initialized = true
  END EFFECT

  FUNCTION acceptAll():
    localStorage.setItem(STORAGE_KEY, 'accepted')
    SET consent = 'accepted'
  END

  FUNCTION rejectAll():
    localStorage.setItem(STORAGE_KEY, 'rejected')
    SET consent = 'rejected'
  END

  RETURN { consent, initialized, acceptAll, rejectAll }
END HOOK
```

---

### `app/components/CookieConsentBanner.tsx` (NEW)

**Objective:** Componente visual del banner de consentimiento. Diseño Neo-Brutal, fijo en la parte inferior de la pantalla. Usa hook useConsent para acciones.

**Pseudocode:**
```pseudocode
COMPONENT CookieConsentBanner
  USES useConsent hook -> { consent, initialized, acceptAll, rejectAll }
  USES useTranslation hook -> { t }

  // Don't render until initialized (prevents SSR mismatch)
  IF NOT initialized THEN RETURN null

  // Don't render if user already made a choice
  IF consent !== 'pending' THEN RETURN null

  RENDER:
    <div> // Fixed bottom banner container
      className="fixed bottom-0 left-0 right-0 z-50 p-4"

      <div> // Neo-Brutal card with shadow
        className="relative mx-auto max-w-4xl"

        // Shadow layer
        <div className="absolute inset-0 bg-neo-dark translate-x-1 translate-y-1 rounded" />

        // Content layer
        <div className="relative z-10 bg-neo-panel border-[3px] border-neo-dark rounded p-4 md:p-6">

          // Flex container: text left, buttons right
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            // Text section
            <div className="flex-1">
              <p className="font-bold text-neo-dark mb-1">
                {t('consent_banner_title')}
              </p>
              <p className="text-sm text-gray-700">
                {t('consent_banner_description')}
              </p>
            </div>

            // Buttons section
            <div className="flex gap-3 flex-shrink-0">

              // Reject button (secondary style)
              <NeoBrutalButton
                variant="secondary"
                onClick={rejectAll}
              >
                {t('consent_reject_all')}
              </NeoBrutalButton>

              // Accept button (primary style)
              <NeoBrutalButton
                variant="primary"
                onClick={acceptAll}
              >
                {t('consent_accept_all')}
              </NeoBrutalButton>

            </div>
          </div>
        </div>
      </div>
    </div>
  END RENDER
END COMPONENT
```

**Styling Notes:**
- Usar `z-50` para estar sobre todo el contenido pero debajo de modals (z-50 es nivel overlay)
- Responsive: columna en mobile, fila en desktop
- Colores: `bg-neo-panel` para el fondo, `border-neo-dark` para bordes
- Botón aceptar: `bg-neo-primary` (naranja), botón rechazar: `bg-white`

---

### `app/components/GoogleAnalytics.tsx` (MODIFY)

**Objective:** Modificar para que solo renderice scripts cuando hay consentimiento. Añadir prop `hasConsent`.

**Pseudocode:**
```pseudocode
INTERFACE GoogleAnalyticsProps:
  measurementId: string | undefined
  nodeEnv: string
  hashedUserId: string | null
  hasConsent: boolean  // NEW PROP

COMPONENT GoogleAnalytics
  PROPS { measurementId, nodeEnv, hashedUserId, hasConsent }

  // Early return if no measurement ID
  IF NOT measurementId THEN RETURN null

  // NEW: Early return if no consent
  IF NOT hasConsent THEN RETURN null

  // Existing render logic (unchanged)
  RETURN <>
    <script async src="gtag...">
    <script dangerouslySetInnerHTML={...}>
  </>
END COMPONENT
```

---

### `app/root.tsx` (MODIFY)

**Objective:** Integrar CookieConsentBanner y pasar estado de consentimiento a GoogleAnalytics.

**Changes:**
1. Import `useConsent` hook
2. Import `CookieConsentBanner` component
3. Call `useConsent()` to get consent state
4. Pass `hasConsent={consent === 'accepted'}` to `GoogleAnalytics`
5. Render `CookieConsentBanner` at the end of the body (before Scripts)

**Pseudocode:**
```pseudocode
// New imports
IMPORT useConsent from '~/hooks/useConsent'
IMPORT CookieConsentBanner from '~/components/CookieConsentBanner'

COMPONENT App
  // Existing code...

  // NEW: Get consent state
  CONST { consent } = useConsent()

  // Existing render...
  RETURN (
    <NeoBrutalToastProvider>
      <ThemeProvider>

        // MODIFIED: Pass hasConsent prop
        <GoogleAnalytics
          measurementId={gaMeasurementId}
          nodeEnv={nodeEnv}
          hashedUserId={hashedUserId}
          hasConsent={consent === 'accepted'}  // NEW
        />

        <I18nextProvider>
          {/* Existing layout */}
        </I18nextProvider>

        // NEW: Render banner
        <CookieConsentBanner />

      </ThemeProvider>
    </NeoBrutalToastProvider>
  )
END COMPONENT
```

**Note:** El banner se renderiza fuera del I18nextProvider porque necesita acceso a traducciones. Asegurarse de que está dentro de I18nextProvider o mover el banner dentro del provider.

---

### `app/locales/en.json` (MODIFY)

**Objective:** Añadir claves i18n para el banner de consentimiento.

**New Keys:**
```json
{
  "consent_banner_title": "We use cookies for analytics",
  "consent_banner_description": "We use Google Analytics to understand how you use our site and improve your experience. No personal data is shared with third parties.",
  "consent_accept_all": "Accept All",
  "consent_reject_all": "Reject All"
}
```

---

### `app/locales/es.json` (MODIFY)

**Objective:** Añadir claves i18n para el banner de consentimiento en español.

**New Keys:**
```json
{
  "consent_banner_title": "Usamos cookies para analítica",
  "consent_banner_description": "Usamos Google Analytics para entender cómo usas nuestro sitio y mejorar tu experiencia. No compartimos datos personales con terceros.",
  "consent_accept_all": "Aceptar todo",
  "consent_reject_all": "Rechazar todo"
}
```

---

## 4. I18N Section

### Existing keys to reuse
- Ninguna clave existente es reutilizable para este feature

### New keys to create

| Key | English | Spanish |
|-----|---------|---------|
| `consent_banner_title` | We use cookies for analytics | Usamos cookies para analítica |
| `consent_banner_description` | We use Google Analytics to understand how you use our site and improve your experience. No personal data is shared with third parties. | Usamos Google Analytics para entender cómo usas nuestro sitio y mejorar tu experiencia. No compartimos datos personales con terceros. |
| `consent_accept_all` | Accept All | Aceptar todo |
| `consent_reject_all` | Reject All | Rechazar todo |

---

## 5. E2E Test Plan

### Test: GA does not load without consent

**Preconditions:**
- Usuario nuevo (localStorage vacío)
- `GA_MEASUREMENT_ID` configurado en el entorno

**Steps:**
1. Navegar a la página principal `/`
2. Verificar que el banner de consentimiento es visible
3. Verificar que NO existe el script de gtag.js en el DOM
4. Verificar que `window.gtag` es undefined
5. Verificar que `window.dataLayer` no tiene eventos de GA

**Expected Result:**
- Banner visible con título y botones
- No hay `<script src="googletagmanager.com/gtag/js">` en el documento
- `window.gtag` es undefined

---

### Test: GA loads after consent is given

**Preconditions:**
- Usuario nuevo (localStorage vacío)
- `GA_MEASUREMENT_ID` configurado en el entorno

**Steps:**
1. Navegar a la página principal `/`
2. Verificar que el banner de consentimiento es visible
3. Hacer clic en el botón "Accept All"
4. Esperar a que el script se cargue
5. Verificar que el script de gtag.js existe en el DOM
6. Verificar que `window.gtag` es una función
7. Verificar que el banner ya no es visible
8. Refrescar la página
9. Verificar que el banner NO aparece (preferencia guardada)
10. Verificar que GA sigue cargado

**Expected Result:**
- Tras aceptar, el script gtag.js se carga dinámicamente
- `window.gtag` es una función
- El banner desaparece
- Tras refresh, el banner no aparece y GA está cargado

---

### Test: GA does not load after rejection

**Preconditions:**
- Usuario nuevo (localStorage vacío)

**Steps:**
1. Navegar a la página principal `/`
2. Hacer clic en el botón "Reject All"
3. Verificar que el banner desaparece
4. Verificar que NO existe el script de gtag.js
5. Refrescar la página
6. Verificar que el banner NO aparece
7. Verificar que GA sigue sin cargar

**Expected Result:**
- Tras rechazar, no se carga gtag.js
- La preferencia persiste tras refresh
- GA nunca se carga para este usuario

---

### Test: Banner displays correctly in both languages

**Preconditions:**
- Usuario nuevo (localStorage vacío)

**Steps:**
1. Navegar a `/` con idioma inglés
2. Verificar que el banner muestra "We use cookies for analytics"
3. Verificar que los botones dicen "Accept All" y "Reject All"
4. Cambiar idioma a español
5. Verificar que el banner muestra "Usamos cookies para analítica"
6. Verificar que los botones dicen "Aceptar todo" y "Rechazar todo"

**Expected Result:**
- Textos correctos en cada idioma
- El banner responde al cambio de idioma

---

### Test: Banner is responsive on mobile

**Preconditions:**
- Usuario nuevo
- Viewport móvil (375px width)

**Steps:**
1. Navegar a `/` en viewport móvil
2. Verificar que el banner es visible y no causa scroll horizontal
3. Verificar que los botones se muestran en columna o están correctamente organizados
4. Verificar que todo el texto es legible

**Expected Result:**
- Banner responsive sin overflow
- Botones accesibles en mobile
- Diseño Neo-Brutal mantenido

---

## Implementation Notes

### localStorage Key
El key `biolinq_analytics_consent` debe ser único y descriptivo. Los valores posibles son:
- `'accepted'` - Usuario aceptó analytics
- `'rejected'` - Usuario rechazó analytics
- (no existe) - Usuario no ha tomado decisión, mostrar banner

### Hydration Mismatch Prevention
El hook `useConsent` inicializa `consent` como `'pending'` y `initialized` como `false`. El componente del banner no renderiza nada hasta que `initialized` es `true`. Esto evita hydration mismatches porque el server siempre renderiza "nada" para el banner.

### Event Tracking After Consent
Cuando el usuario acepta después de ya haber navegado, los eventos previos no se rastrean. Esto es aceptable para GDPR compliance. Solo los eventos futuros se enviarán a GA.

### Testing Consideration (from KNOWN_ISSUES.md)
Para tests E2E de GA4 events, recordar usar `Array.from()` al inspeccionar `window.dataLayer` porque las entradas son objetos Arguments, no arrays.
