# FEATURE_3.7_UserGA4Configuration.md

## 1. Natural Language Description

### Current State

- El dashboard tiene una sección de Customization con theme selector y color pickers
- La página pública (`/:username`) NO tiene Google Analytics 4 integrado
- Existe la variable de entorno `GA_MEASUREMENT_ID` configurada pero no se usa en ningún lado
- Los usuarios premium pueden personalizar colores; los free ven contenido bloqueado con badge "PREMIUM"
- Los clicks en links se trackean en `/go/:linkId` solo a nivel de base de datos (no GA4)

### Expected End State

- Nueva sección "Analytics" en el dashboard, debajo de Customization (sección separada con su propia card)
- Los usuarios premium pueden configurar su propio GA4 Measurement ID (formato `G-XXXXXXXXXX`)
- Los usuarios free ven la sección bloqueada con blur + badge "PREMIUM"
- La página pública carga dos scripts GA4:
  1. **GA4 del sitio** (siempre): desde `env.GA_MEASUREMENT_ID` - para analytics del propietario de BioLinq
  2. **GA4 del usuario** (si premium + configurado): desde `biolinks.ga4_measurement_id` - para analytics del usuario
- Eventos que se envían al GA4 del usuario (solo si configurado + premium):
  - `page_view`: automático al cargar la página
  - `link_click`: cuando alguien hace click en un link, con datos: `link_url`, `link_title`, `link_position`

---

## 2. Technical Description

### High-Level Approach

1. **Database Migration**: Agregar columna `ga4_measurement_id` al schema de `biolinks`
2. **Service Layer**: Crear `app/services/ga4.server.ts` con función para actualizar GA4 ID con validación de formato y check de premium
3. **Dashboard Component**: Crear `GA4Settings.tsx` siguiendo el patrón de `CustomizationSection` (blur + premium badge para free users)
4. **Dashboard Integration**: Agregar nueva sección al dashboard debajo de Customization
5. **Dashboard Action**: Agregar handler para intent `updateGA4` con validación y premium check
6. **Public Page**: Modificar `public.tsx` para pasar GA4 IDs a componente, crear componente de scripts

### Architecture Decisions

- **Dual GA4 Strategy**: El GA4 del sitio siempre se carga; el del usuario solo si está configurado Y es premium
- **Server-Side Validation**: La validación del formato GA4 ocurre tanto en frontend (UX) como en backend (seguridad)
- **Premium Check**: El servicio valida premium status antes de persistir, no confiamos solo en el frontend
- **Client-Side Click Tracking**: Los eventos de click se envían desde el cliente para evitar latencia en redirección

---

## 2.1. Architecture Gate

- **Pages are puzzles:** `dashboard.tsx` solo compone componentes (`GA4Settings`), `public.tsx` compone `PublicProfile` y `GA4Scripts`
- **Loaders/actions are thin:**
  - Loader de dashboard ya existe, solo necesita incluir `ga4MeasurementId` del biolink
  - Action llama a `updateGA4MeasurementId` del servicio y retorna
- **Business logic is not in components:**
  - Validación de formato GA4 en `app/lib/ga4-validation.ts`
  - Persistencia y premium check en `app/services/ga4.server.ts`
  - Componentes solo renderizan y llaman hooks/forms

### Route Module Breakdown

**`app/routes/dashboard.tsx`**:
- **Loader**: Ya retorna `biolink` con `ga4MeasurementId`
- **Action**: Agrega case para `intent === 'updateGA4'` que llama `updateGA4MeasurementId`
- **Component**: Agrega `<GA4Settings>` en el grid

**`app/routes/public.tsx`**:
- **Loader**: Ya retorna `biolink` y `user` - necesita exponer `ga4MeasurementId` + `isPremium`
- **Component**: Pasa datos a `<GA4Scripts>` que inyecta los scripts

### Component Breakdown

**`GA4Settings.tsx`**:
- **Hooks**: `useFetcher`, `useTranslation`, `useState` para input value
- **No business logic**: Solo estado de UI y form submission

**`GA4Scripts.tsx`**:
- **Props**: `siteGA4Id`, `userGA4Id`, `links` (para click tracking)
- **No hooks**: Componente puro que renderiza `<script>` tags

---

## 3. Files to Change/Create

### `app/db/schema/biolinks.ts`

**Objective:** Agregar columna para almacenar el GA4 Measurement ID del usuario

**Pseudocode:**
```pseudocode
// Add to existing biolinks table definition
ga4MeasurementId: varchar('ga4_measurement_id', { length: 20 })
  // nullable, only for premium users
  // format: G-XXXXXXXXXX (10 alphanumeric chars after G-)
```

---

### `app/lib/ga4-validation.ts` (NEW)

**Objective:** Validación de formato GA4 Measurement ID reutilizable en frontend y backend

**Pseudocode:**
```pseudocode
CONSTANT GA4_REGEX = /^G-[A-Z0-9]{10}$/

FUNCTION isValidGA4Id(id: string): boolean
  IF id is empty or null
    RETURN true  // Empty is valid (user clearing the field)
  END IF
  RETURN GA4_REGEX.test(id)
END

FUNCTION formatGA4Error(t: TFunction): string
  RETURN t('ga4_invalid_format')  // "Must be in format G-XXXXXXXXXX"
END
```

---

### `app/services/ga4.server.ts` (NEW)

**Objective:** Servicio para actualizar GA4 ID con validación y premium check

**Pseudocode:**
```pseudocode
TYPE GA4Error = 'BIOLINK_NOT_FOUND' | 'INVALID_GA4_FORMAT' | 'PREMIUM_REQUIRED'
TYPE UpdateGA4Result = { success: true } | { success: false; error: GA4Error }

FUNCTION updateGA4MeasurementId(
  userId: string,
  biolinkId: string,
  ga4Id: string | null
): Promise<UpdateGA4Result>

  // 1. Fetch biolink with user to verify ownership and premium status
  biolink = SELECT FROM biolinks
    JOIN users ON biolinks.user_id = users.id
    WHERE biolinks.id = biolinkId AND biolinks.user_id = userId

  IF biolink is null
    RETURN { success: false, error: 'BIOLINK_NOT_FOUND' }
  END IF

  // 2. Check premium status (user can clear even if not premium, but can't set)
  IF ga4Id is not null AND ga4Id is not empty AND NOT biolink.user.isPremium
    RETURN { success: false, error: 'PREMIUM_REQUIRED' }
  END IF

  // 3. Validate format (if setting a value)
  IF ga4Id is not null AND ga4Id is not empty
    IF NOT isValidGA4Id(ga4Id)
      RETURN { success: false, error: 'INVALID_GA4_FORMAT' }
    END IF
  END IF

  // 4. Update database
  UPDATE biolinks
    SET ga4_measurement_id = (ga4Id OR null), updated_at = NOW()
    WHERE id = biolinkId

  RETURN { success: true }
END
```

---

### `app/components/dashboard/GA4Settings.tsx` (NEW)

**Objective:** Componente de configuración GA4 con estado locked para free users

**Pseudocode:**
```pseudocode
COMPONENT GA4Settings
  PROPS:
    currentGA4Id: string | null
    biolinkId: string
    isPremium: boolean

  STATE:
    ga4Id: string = currentGA4Id ?? ''
    validationError: string | null = null

  HOOKS:
    fetcher = useFetcher()
    { t } = useTranslation()

  DERIVED:
    isLocked = NOT isPremium
    isSubmitting = fetcher.state === 'submitting'
    hasChanges = ga4Id !== (currentGA4Id ?? '')

  FUNCTION handleChange(value: string)
    SET ga4Id = value.toUpperCase()  // Normalize to uppercase
    IF value is not empty AND NOT isValidGA4Id(value)
      SET validationError = t('ga4_invalid_format')
    ELSE
      SET validationError = null
    END IF
  END

  RENDER:
    <NeoBrutalCard variant="white">
      <h3>{t('ga4_title')}</h3>  // "Analytics"

      <p className="text-sm text-gray-600 mb-4">{t('ga4_description')}</p>
      // "Track your page visits with Google Analytics 4"

      <div className="relative">
        // Blur content for free users
        <div className={cn(isLocked && 'opacity-50 blur-[1px] select-none pointer-events-none')}>

          <label>{t('ga4_id_label')}</label>  // "Measurement ID"

          <NeoBrutalInput
            value={ga4Id}
            onChange={handleChange}
            placeholder="G-XXXXXXXXXX"
            disabled={isLocked}
            className={validationError ? 'border-red-500' : ''}
          />

          IF validationError
            <p className="text-red-500 text-sm mt-1">{validationError}</p>
          END IF

        </div>

        // Premium overlay (same pattern as CustomizationSection)
        IF isLocked
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-neo-accent text-white text-xs font-bold px-2 py-1 border border-neo-dark">
              PREMIUM
            </span>
          </div>
        END IF
      </div>

      // Save button (outside blur)
      <div className="mt-6 pt-4 border-t border-gray-200">
        <fetcher.Form method="post">
          <input type="hidden" name="intent" value="updateGA4" />
          <input type="hidden" name="biolinkId" value={biolinkId} />
          <input type="hidden" name="ga4Id" value={ga4Id || ''} />

          <NeoBrutalButton
            type="submit"
            disabled={!hasChanges || isLocked || isSubmitting || validationError !== null}
            className="w-full"
          >
            {isSubmitting ? t('saving') : t('customization_save')}
          </NeoBrutalButton>
        </fetcher.Form>
      </div>
    </NeoBrutalCard>
  END RENDER
END COMPONENT
```

---

### `app/components/dashboard/index.ts`

**Objective:** Exportar el nuevo componente

**Pseudocode:**
```pseudocode
// Add to existing exports
EXPORT { GA4Settings } FROM './GA4Settings'
```

---

### `app/routes/dashboard.tsx`

**Objective:** Integrar GA4Settings en el dashboard y agregar action handler

**Pseudocode:**
```pseudocode
// IMPORT (add to existing)
IMPORT { updateGA4MeasurementId } FROM '~/services/ga4.server'
IMPORT { GA4Settings } FROM '~/components/dashboard'

// LOADER: No changes needed - biolink already includes ga4MeasurementId

// ACTION: Add new intent case
IF intent === 'updateGA4'
  biolinkId = formData.get('biolinkId')
  ga4Id = formData.get('ga4Id') as string

  // Normalize: empty string becomes null
  normalizedGA4Id = ga4Id?.trim() || null

  result = await updateGA4MeasurementId(
    authSession.user.id,
    biolinkId,
    normalizedGA4Id
  )

  IF NOT result.success
    RETURN data({ error: result.error })
  END IF

  RETURN redirect('/dashboard')
END IF

// COMPONENT: Add GA4Settings after CustomizationSection
<div className="space-y-8">
  <StatsCard ... />
  <LinksList ... />
  <CustomizationSection ... />
  <GA4Settings
    currentGA4Id={biolink.ga4MeasurementId}
    biolinkId={biolink.id}
    isPremium={user.isPremium}
  />
</div>
```

---

### `app/components/public/GA4Scripts.tsx` (NEW)

**Objective:** Inyectar scripts de GA4 (site y user) con tracking de clicks

**Pseudocode:**
```pseudocode
COMPONENT GA4Scripts
  PROPS:
    siteGA4Id: string | null        // From env GA_MEASUREMENT_ID
    userGA4Id: string | null        // From biolinks.ga4_measurement_id
    userIsPremium: boolean          // Only inject user GA4 if premium
    links: Array<{ id, url, title, position }>  // For click tracking

  RENDER:
    // Site GA4 (always present if configured)
    IF siteGA4Id
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${siteGA4Id}`} />
      <script dangerouslySetInnerHTML={{
        __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${siteGA4Id}');
        `
      }} />
    END IF

    // User GA4 (only if configured AND premium)
    IF userGA4Id AND userIsPremium
      <script dangerouslySetInnerHTML={{
        __html: `
          // Initialize user's GA4 (separate from site)
          window.userDataLayer = window.userDataLayer || [];
          function userGtag(){userDataLayer.push(arguments);}
          userGtag('js', new Date());
          userGtag('config', '${userGA4Id}');

          // Track link clicks
          window.trackBioLinkClick = function(linkUrl, linkTitle, linkPosition) {
            userGtag('event', 'link_click', {
              link_url: linkUrl,
              link_title: linkTitle,
              link_position: linkPosition,
              send_to: '${userGA4Id}'
            });
          };
        `
      }} />
      // Load gtag.js once (already loaded by site GA4 if present, but ensure it's there)
      IF NOT siteGA4Id
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${userGA4Id}`} />
      END IF
    END IF
  END RENDER
END COMPONENT
```

---

### `app/components/public/PublicLinkCard.tsx`

**Objective:** Agregar tracking de click para GA4 del usuario

**Pseudocode:**
```pseudocode
COMPONENT PublicLinkCard
  PROPS: (existing)
    linkId: string
    title: string
    url: string
    emoji: string | null
    position: number  // ADD THIS - pass from parent

  FUNCTION handleClick()
    // Call user GA4 tracking if available (function injected by GA4Scripts)
    IF typeof window !== 'undefined' AND window.trackBioLinkClick
      window.trackBioLinkClick(url, title, position)
    END IF
  END

  RENDER:
    <a
      href={`/go/${linkId}`}
      onClick={handleClick}  // ADD THIS
      ...existing props
    >
      ...existing content
    </a>
  END RENDER
END COMPONENT
```

---

### `app/components/public/PublicProfile.tsx`

**Objective:** Pasar position a PublicLinkCard e integrar GA4Scripts

**Pseudocode:**
```pseudocode
COMPONENT PublicProfile
  PROPS: (add new)
    siteGA4Id: string | null
    userGA4Id: string | null
    userIsPremium: boolean
    ...existing props

  RENDER:
    <>
      <GA4Scripts
        siteGA4Id={siteGA4Id}
        userGA4Id={userGA4Id}
        userIsPremium={userIsPremium}
        links={links}
      />

      // ...existing profile content

      // Update links mapping to pass position
      {links.map((link, index) => (
        <PublicLinkCard
          key={link.id}
          linkId={link.id}
          title={link.title}
          url={link.url}
          emoji={link.emoji}
          position={index + 1}  // 1-indexed for user clarity
        />
      ))}
    </>
  END RENDER
END COMPONENT
```

---

### `app/routes/public.tsx`

**Objective:** Pasar GA4 IDs al componente PublicProfile

**Pseudocode:**
```pseudocode
// LOADER: Add site GA4 ID from env
FUNCTION loader
  // ...existing code...

  RETURN data({
    biolink: result.biolink,
    user: result.user,
    links,
    isPreview,
    siteGA4Id: process.env.GA_MEASUREMENT_ID ?? null,  // ADD THIS
  }, { headers })
END

// COMPONENT: Pass GA4 data to PublicProfile
FUNCTION PublicPage
  const data = useLoaderData()

  RETURN (
    <PublicProfile
      user={data.user}
      biolink={data.biolink}
      links={data.links}
      isPreview={data.isPreview}
      siteGA4Id={data.siteGA4Id}                       // ADD
      userGA4Id={data.biolink.ga4MeasurementId}        // ADD
      userIsPremium={data.user.isPremium}              // ADD
    />
  )
END
```

---

### `app/routes/api.__test__.ga4.tsx` (NEW)

**Objective:** Test API route para E2E tests del servicio GA4

**Pseudocode:**
```pseudocode
// Only available when DB_TEST_URL is set

LOADER: GET /api/__test__/ga4?biolinkId=xxx
  IF NOT process.env.DB_TEST_URL
    RETURN 404
  END IF

  biolinkId = url.searchParams.get('biolinkId')
  biolink = SELECT ga4_measurement_id FROM biolinks WHERE id = biolinkId

  RETURN { ga4MeasurementId: biolink.ga4_measurement_id }
END

ACTION: POST /api/__test__/ga4
  IF NOT process.env.DB_TEST_URL
    RETURN 404
  END IF

  body = await request.json()
  { userId, biolinkId, ga4Id } = body

  result = await updateGA4MeasurementId(userId, biolinkId, ga4Id)

  RETURN result
END
```

---

### `app/routes.ts`

**Objective:** Registrar la nueva ruta de test API

**Pseudocode:**
```pseudocode
// Add to existing routes
route('api/__test__/ga4', 'routes/api.__test__.ga4.tsx'),
```

---

## 4. I18N Section

### Existing keys to reuse

- `customization_save` - "Save Changes" (for the save button)
- `saving` - "Saving..." (for loading state)
- `customization_premium_required` - "Premium required to customize"

### New keys to create

| Key | English | Spanish |
|-----|---------|---------|
| `ga4_title` | Analytics | Analytics |
| `ga4_description` | Track your page visits with Google Analytics 4 | Rastrea las visitas a tu página con Google Analytics 4 |
| `ga4_id_label` | Measurement ID | ID de Medición |
| `ga4_id_placeholder` | G-XXXXXXXXXX | G-XXXXXXXXXX |
| `ga4_invalid_format` | Must be in format G-XXXXXXXXXX | Debe tener el formato G-XXXXXXXXXX |
| `ga4_error_premium_required` | GA4 tracking requires Premium | El tracking GA4 requiere Premium |

---

## 5. E2E Test Plan

### Test File: `tests/e2e/ga4-settings.spec.ts`

---

### Test: Premium user can save valid GA4 ID

**Preconditions:**
- User exists with `isPremium: true`
- User has a biolink

**Steps:**
1. Create premium user and biolink via seeders
2. POST to `/api/__test__/ga4` with valid GA4 ID (`G-TEST123456`)
3. GET `/api/__test__/ga4?biolinkId=xxx` to verify

**Expected:**
- POST returns `{ success: true }`
- GET returns `{ ga4MeasurementId: 'G-TEST123456' }`

---

### Test: Premium user can clear GA4 ID

**Preconditions:**
- Premium user with existing GA4 ID configured

**Steps:**
1. Create premium user with biolink that has GA4 ID set
2. POST to `/api/__test__/ga4` with empty string or null
3. GET to verify cleared

**Expected:**
- POST returns `{ success: true }`
- GET returns `{ ga4MeasurementId: null }`

---

### Test: Invalid GA4 ID format shows validation error

**Preconditions:**
- Premium user with biolink

**Steps:**
1. POST to `/api/__test__/ga4` with invalid formats:
   - `INVALID`
   - `G-123` (too short)
   - `GA-1234567890` (wrong prefix)
   - `g-test123456` (lowercase)

**Expected:**
- Each POST returns `{ success: false, error: 'INVALID_GA4_FORMAT' }`

---

### Test: Free user cannot save GA4 ID (API level)

**Preconditions:**
- User exists with `isPremium: false`
- User has a biolink

**Steps:**
1. Create free user and biolink
2. POST to `/api/__test__/ga4` with valid GA4 ID

**Expected:**
- Returns `{ success: false, error: 'PREMIUM_REQUIRED' }`

---

### Test: Free user sees locked GA4 section in dashboard

**Preconditions:**
- Free user logged in with biolink

**Steps:**
1. Login as free user
2. Navigate to `/dashboard`
3. Scroll to Analytics section

**Expected:**
- GA4 input is visible but blurred
- "PREMIUM" badge is displayed over the section
- Input cannot be interacted with (pointer-events-none)
- Save button is disabled

---

### Test: Premium user sees functional GA4 section in dashboard

**Preconditions:**
- Premium user logged in with biolink

**Steps:**
1. Login as premium user
2. Navigate to `/dashboard`
3. Find Analytics section

**Expected:**
- GA4 input is visible and interactive
- No blur or PREMIUM badge
- Can type in the input field
- Save button is enabled when input has changes

---

### Test: Public page includes site GA4 script always

**Preconditions:**
- User with biolink exists
- `GA_MEASUREMENT_ID` env var is set

**Steps:**
1. Navigate to `/:username` (public page)
2. Inspect page source/scripts

**Expected:**
- Script tag for `gtag.js` with site GA4 ID is present
- `gtag('config', 'G-SITE-ID')` is executed

---

### Test: Public page includes user GA4 script only for premium users

**Preconditions:**
- Premium user with biolink that has GA4 ID configured

**Steps:**
1. Navigate to `/:username` (public page)
2. Inspect page source/scripts

**Expected:**
- Both site GA4 and user GA4 scripts are present
- `window.trackBioLinkClick` function is defined

---

### Test: Public page does NOT include user GA4 for free users

**Preconditions:**
- Free user with biolink (even if `ga4_measurement_id` somehow has a value)

**Steps:**
1. Navigate to `/:username` (public page)
2. Inspect page source/scripts

**Expected:**
- Only site GA4 script is present
- `window.trackBioLinkClick` is NOT defined

---

### Test: Link click triggers user GA4 event (integration)

**Preconditions:**
- Premium user with GA4 ID configured
- Has at least one link

**Steps:**
1. Navigate to public page
2. Mock/intercept `window.trackBioLinkClick`
3. Click on first link
4. Verify tracking function was called

**Expected:**
- `trackBioLinkClick` called with correct params: `(url, title, 1)`
- Link still navigates to `/go/:linkId`

---

## 6. Database Migration Notes

After implementing the schema change in `app/db/schema/biolinks.ts`:

1. Run `npm run db:generate` to create migration file
2. Run `npm run db:migrate` to apply to development database
3. Verify with: `SELECT column_name FROM information_schema.columns WHERE table_name = 'biolinks'`

The migration will add:
- `ga4_measurement_id VARCHAR(20) NULL` to `biolinks` table

---

## 7. Type Declaration for Window

Add to `app/types/global.d.ts` (create if doesn't exist):

```typescript
declare global {
  interface Window {
    trackBioLinkClick?: (linkUrl: string, linkTitle: string, linkPosition: number) => void;
  }
}

export {};
```
