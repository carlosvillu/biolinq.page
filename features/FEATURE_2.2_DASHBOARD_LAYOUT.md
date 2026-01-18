# FEATURE_2.2_DASHBOARD_LAYOUT.md

## 1. Natural Language Description

### Current State
El dashboard (`/dashboard`) es un placeholder mínimo que muestra un mensaje "Coming soon" con el email del usuario autenticado. No tiene funcionalidad ni el diseño Neo-Brutal del mockup.

### Expected End State
El dashboard tendrá el layout completo basado en el mockup `mockups/mockup.html` (sección "Dashboard"):

1. **Header del sitio** - Reutiliza el `Header` existente (`app/components/Header.tsx`):
   - Logo "BioLinq BETA" a la izquierda
   - `UserDropdown` con el usuario autenticado
   - `LanguageSelector`

2. **Layout responsive** con dos columnas en desktop:
   - **Columna izquierda** (1.5fr): Stats card + espacio para el editor de links (Task 2.3/2.4)
   - **Columna derecha** (1fr): Preview del iPhone con vista previa en vivo

3. **Stats Card** básico:
   - "Visitas Totales" con número real desde `biolinks.totalViews`
   - "Clicks" bloqueado/difuminado con badge "PREMIUM"

4. **Preview del iPhone**:
   - Frame de móvil con notch
   - Contenido simulado del perfil público (avatar, nombre, bio placeholder)
   - Indicador "Vista Previa en vivo" con punto verde animado
   - En móvil (< lg) se oculta

5. **Placeholder** para el editor de links (se implementa en Task 2.3/2.4)

6. **Banner Premium** (solo usuarios free):
   - Fullwidth bajo el Header
   - Estilo Neo-Brutal con fondo `neo-accent` y borde grueso
   - Mensaje persuasivo + CTA "Go Premium (5€)"
   - Botón con estilo `NeoBrutalButton` variant primary
   - El botón es visual/disabled (sin funcionalidad real aún)

---

## 2. Technical Description

### High-Level Approach
- Reutilizar el `Header` existente del sitio (consistencia visual)
- Usar los componentes Neo-Brutal existentes (`NeoBrutalCard`, `NeoBrutalButton`)
- Crear componentes específicos del dashboard en `app/components/dashboard/`
- El loader obtiene datos del usuario, biolink y links
- Usar Base UI Avatar para el avatar en el PhonePreview

### Architecture Decisions
- **Header compartido**: El dashboard reutiliza el `Header` existente (`app/components/Header.tsx`) que ya tiene `UserDropdown` y `LanguageSelector`
- **No nested routes**: El dashboard es una ruta plana, no usa layout anidado
- **Componentes presentacionales**: Los componentes del dashboard son puramente visuales
- **Datos del preview**: Los datos para el PhonePreview vienen directamente del loader

### Dependencies
- `@base-ui-components/react` - Para el componente Avatar accesible
- Componentes Neo-Brutal existentes

---

## 2.1. Architecture Gate

- **Pages are puzzles:** La ruta `dashboard.tsx` compone `Header` (existente), `StatsCard`, `LinksEditorPlaceholder` y `PhonePreview`. No tiene UI propia más allá de la composición.
- **Loaders/actions are thin:** El loader solo autentica, obtiene el biolink del usuario y sus links via servicios, y retorna data.
- **Business logic is not in components:**
  - Domain logic: ya existe en `app/services/username.server.ts` y `app/services/links.server.ts`
  - Components: solo renderizan props recibidas

### Route Module Breakdown

**`app/routes/dashboard.tsx`**
- **Loader**: Llama a `getCurrentUser()`, `getUserBiolink()`, `getLinksByBiolinkId()`
- **Action**: No se implementa en esta tarea
- **Component**: Compone `Header`, columna izquierda (stats + placeholder), columna derecha (preview)

### Component Breakdown

| Component | Hooks Used | Business Logic |
|-----------|-----------|----------------|
| `Header` (existente) | `useNavigate`, `useTranslation` | NINGUNA - usa `UserDropdown` |
| `PremiumBanner` | ninguno | NINGUNA - visual puro, CTA disabled |
| `DashboardAvatar` | ninguno | NINGUNA - wrapper de Base UI Avatar |
| `StatsCard` | ninguno | NINGUNA - solo renderiza totalViews |
| `PremiumBadge` | ninguno | NINGUNA - visual puro |
| `PhonePreview` | ninguno | NINGUNA - renderiza datos del biolink |
| `LinksEditorPlaceholder` | ninguno | NINGUNA - placeholder visual |

---

## 3. Files to Change/Create

### `app/routes/dashboard.tsx`
**Objective:** Ruta del dashboard con layout de dos columnas, Header del sitio y preview del iPhone.

**Pseudocode:**
```pseudocode
// LOADER
FUNCTION loader(request)
  authSession = getCurrentUser(request)
  IF NOT authSession.user THEN redirect('/auth/login')

  biolink = getUserBiolink(authSession.user.id)
  IF NOT biolink THEN redirect('/') // Usuario sin biolink debe elegir username

  linksResult = getLinksByBiolinkId(authSession.user.id, biolink.id)
  links = linksResult.success ? linksResult.links : []

  RETURN { user: authSession.user, session: authSession.session, biolink, links }
END

// COMPONENT
COMPONENT DashboardPage
  { user, session, biolink, links } = useLoaderData()

  RENDER:
    <div className="min-h-screen bg-neo-input/30">
      <!-- Reutiliza el Header existente del sitio -->
      <Header session={session} user={user} />

      <!-- Banner Premium para usuarios free -->
      IF NOT user.isPremium THEN
        <PremiumBanner />

      <main className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-[1.5fr_1fr] gap-8">
        <!-- Left Column -->
        <div className="space-y-8">
          <StatsCard
            totalViews={biolink.totalViews}
            isPremium={user.isPremium}
          />
          <LinksEditorPlaceholder linkCount={links.length} />
        </div>

        <!-- Right Column (hidden on mobile) -->
        <PhonePreview
          username={biolink.username}
          userName={user.name}
          userImage={user.image}
          links={links}
        />
      </main>
    </div>
END
```

---

### `app/components/dashboard/PremiumBanner.tsx`
**Objective:** Banner fullwidth Neo-Brutal para incentivar upgrade a Premium.

**Pseudocode:**
```pseudocode
COMPONENT PremiumBanner
  { t } = useTranslation()

  RENDER:
    <div className="w-full bg-neo-accent border-b-[3px] border-neo-dark">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <!-- Message -->
        <div className="flex items-center gap-3 text-white">
          <span className="text-xl">✨</span>
          <p className="font-bold text-sm sm:text-base">
            {t('premium_banner_message')}
          </p>
        </div>

        <!-- CTA Button -->
        <NeoBrutalButton
          variant="primary"
          size="sm"
          disabled
          className="whitespace-nowrap"
        >
          {t('premium_banner_cta')}
        </NeoBrutalButton>
      </div>
    </div>
END
```

---

### `app/components/dashboard/DashboardAvatar.tsx`
**Objective:** Wrapper de Base UI Avatar con estilo Neo-Brutal.

**Pseudocode:**
```pseudocode
INTERFACE DashboardAvatarProps
  src: string | null
  fallback: string
  size?: 'sm' | 'md'

COMPONENT DashboardAvatar(props)
  sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm'
  }

  RENDER:
    <Avatar.Root className={cn(
      "rounded-full bg-gray-300 border-2 border-neo-dark overflow-hidden",
      sizeClasses[props.size || 'sm']
    )}>
      IF props.src THEN
        <Avatar.Image
          src={props.src}
          className="w-full h-full object-cover"
        />
      <Avatar.Fallback className="flex items-center justify-center w-full h-full font-bold">
        {props.fallback.toUpperCase()}
      </Avatar.Fallback>
    </Avatar.Root>
END
```

---

### `app/components/dashboard/PremiumBadge.tsx`
**Objective:** Badge que muestra FREE o PREMIUM según estado del usuario.

**Pseudocode:**
```pseudocode
INTERFACE PremiumBadgeProps
  isPremium: boolean

COMPONENT PremiumBadge(props)
  { t } = useTranslation()

  IF props.isPremium THEN
    RENDER:
      <span className="bg-neo-dark text-neo-primary px-2 py-0.5 rounded-sm text-xs font-bold font-mono tracking-wider">
        PREMIUM
      </span>
  ELSE
    RENDER:
      <span className="bg-gray-200 text-[10px] px-1 border border-neo-dark font-mono">
        FREE
      </span>
END
```

---

### `app/components/dashboard/StatsCard.tsx`
**Objective:** Card que muestra estadísticas básicas (views) y bloqueadas (clicks para premium).

**Pseudocode:**
```pseudocode
INTERFACE StatsCardProps
  totalViews: number
  isPremium: boolean

COMPONENT StatsCard(props)
  { t } = useTranslation()

  RENDER:
    <NeoBrutalCard variant="white">
      <div className="flex justify-between items-center py-4">
        <!-- Total Views (visible for all) -->
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            {t('dashboard_total_views')}
          </h3>
          <p className="text-3xl font-black mt-1">
            {formatNumber(props.totalViews)}
          </p>
        </div>

        <!-- Clicks (locked for free users) -->
        <div className={cn(
          "text-right relative",
          !props.isPremium && "opacity-50 blur-[1px] select-none cursor-not-allowed"
        )}>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            {t('dashboard_clicks')}
          </h3>
          <p className="text-3xl font-black mt-1">---</p>

          IF NOT props.isPremium THEN
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-neo-accent text-white text-xs font-bold px-2 py-1 border border-neo-dark shadow-sm">
                PREMIUM
              </span>
            </div>
        </div>
      </div>
    </NeoBrutalCard>
END
```

---

### `app/components/dashboard/PhonePreview.tsx`
**Objective:** Preview del biolink en un frame de iPhone.

**Pseudocode:**
```pseudocode
INTERFACE PhonePreviewProps
  username: string
  userName: string | null
  userImage: string | null
  links: Link[]

COMPONENT PhonePreview(props)
  { t } = useTranslation()

  RENDER:
    <div className="hidden lg:flex flex-col items-center sticky top-8 h-[calc(100vh-4rem)]">
      <!-- Live preview indicator -->
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 bg-green-500 rounded-full border border-neo-dark animate-pulse" />
        <span className="font-mono text-sm">{t('dashboard_live_preview')}</span>
      </div>

      <!-- Phone Frame -->
      <div className="relative w-[320px] h-[640px] border-[4px] border-neo-dark rounded-[2.5rem] bg-neo-dark shadow-hard-lg overflow-hidden p-2">
        <!-- Screen -->
        <div className="w-full h-full bg-white rounded-[2rem] overflow-y-auto overflow-x-hidden">
          <ProfilePreviewContent
            userName={props.userName}
            userImage={props.userImage}
            links={props.links}
          />
        </div>

        <!-- Notch -->
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-neo-dark rounded-b-xl z-20" />
      </div>
    </div>
END

// Sub-component for profile content inside phone
COMPONENT ProfilePreviewContent(props)
  RENDER:
    <div className="w-full min-h-full flex flex-col p-6 items-center">
      <!-- Avatar -->
      <div className="w-20 h-20 rounded-full border-[3px] border-neo-dark overflow-hidden mb-4 shadow-hard">
        IF props.userImage THEN
          <img src={props.userImage} className="w-full h-full object-cover" />
        ELSE
          <div className="w-full h-full bg-gray-200 flex items-center justify-center font-bold">
            {props.userName?.charAt(0) || '?'}
          </div>
      </div>

      <!-- Name -->
      <h1 className="text-xl font-black mb-1">
        {props.userName || 'Your Name'}
      </h1>
      <p className="text-sm text-gray-600 mb-8 text-center max-w-[200px]">
        {t('dashboard_preview_bio_placeholder')}
      </p>

      <!-- Links -->
      <div className="w-full space-y-4 flex-1">
        FOR EACH link IN props.links
          <div className="block w-full bg-white border-[3px] border-neo-dark p-3 text-center font-bold shadow-[4px_4px_0_0_#000]">
            {link.emoji} {link.title}
          </div>

        IF props.links.length === 0 THEN
          <div className="text-center text-gray-400 text-sm font-mono py-8">
            {t('dashboard_preview_no_links')}
          </div>
      </div>

      <!-- Watermark -->
      <div className="mt-8 text-[10px] text-gray-400 font-mono text-center">
        Made with BioLinq.page
      </div>
    </div>
END
```

---

### `app/components/dashboard/LinksEditorPlaceholder.tsx`
**Objective:** Placeholder visual para el editor de links (implementado en Task 2.3/2.4).

**Pseudocode:**
```pseudocode
INTERFACE LinksEditorPlaceholderProps
  linkCount: number

COMPONENT LinksEditorPlaceholder(props)
  { t } = useTranslation()

  RENDER:
    <NeoBrutalCard variant="panel">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">
            {t('dashboard_my_links')} ({props.linkCount}/5)
          </h2>
        </div>

        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 font-mono">
            {t('dashboard_links_coming_soon')}
          </p>
        </div>
      </div>
    </NeoBrutalCard>
END
```

---

### `app/components/dashboard/index.ts`
**Objective:** Barrel export de componentes del dashboard.

**Pseudocode:**
```pseudocode
EXPORT:
  - PremiumBanner
  - DashboardAvatar
  - PremiumBadge
  - StatsCard
  - PhonePreview
  - LinksEditorPlaceholder
```

---

### `app/lib/format.ts`
**Objective:** Utilidades de formateo de números.

**Pseudocode:**
```pseudocode
FUNCTION formatNumber(num: number): string
  IF num >= 1000000 THEN
    RETURN (num / 1000000).toFixed(1) + 'M'
  IF num >= 1000 THEN
    RETURN (num / 1000).toFixed(1) + 'K'
  RETURN num.toLocaleString()
END
```

---

## 4. I18N

### Existing keys to reuse
- `login` - Para posible link de login si no autenticado

### New keys to create

| Key | English | Spanish |
|-----|---------|---------|
| `premium_banner_message` | Unlock analytics, custom colors & remove watermark | Desbloquea analíticas, colores personalizados y quita la marca de agua |
| `premium_banner_cta` | Go Premium — 5€ | Hazte Premium — 5€ |
| `dashboard_total_views` | Total Views | Visitas Totales |
| `dashboard_clicks` | Clicks | Clicks |
| `dashboard_live_preview` | Live Preview | Vista Previa en vivo |
| `dashboard_my_links` | My Links | Mis Links |
| `dashboard_links_coming_soon` | Links editor coming in Task 2.3... | Editor de links próximamente... |
| `dashboard_preview_bio_placeholder` | Your bio will appear here | Tu bio aparecerá aquí |
| `dashboard_preview_no_links` | Add your first link! | ¡Añade tu primer link! |

---

## 5. E2E Test Plan

### Test: Dashboard loads correctly for authenticated user with biolink

- **Preconditions:**
  - User exists with email/password
  - User has a biolink with username "testuser"
  - User has 1-2 links
- **Steps:**
  1. Login via API helper
  2. Navigate to `/dashboard`
  3. Wait for page load
- **Expected:**
  - Site Header visible (Logo "BioLinq", UserDropdown)
  - Stats card shows "Total Views"
  - Phone preview visible on desktop viewport
  - Links count shows correct number

### Test: User without biolink is redirected to home

- **Preconditions:**
  - User exists and is authenticated
  - User does NOT have a biolink
- **Steps:**
  1. Login via API helper
  2. Navigate to `/dashboard`
- **Expected:**
  - User is redirected to `/` (home page to claim username)

### Test: Free user sees premium banner with CTA

- **Preconditions:**
  - User exists with `isPremium: false`
  - User has biolink
- **Steps:**
  1. Login
  2. Navigate to `/dashboard`
- **Expected:**
  - Premium banner visible below header
  - Banner has "Go Premium — 5€" button (disabled)
  - Banner message about unlocking features visible

### Test: Premium user does NOT see premium banner

- **Preconditions:**
  - User exists with `isPremium: true`
  - User has biolink
- **Steps:**
  1. Login
  2. Navigate to `/dashboard`
- **Expected:**
  - Premium banner is NOT visible

### Test: Free user sees locked analytics with PREMIUM badge

- **Preconditions:**
  - User exists with `isPremium: false`
  - User has biolink
- **Steps:**
  1. Login
  2. Navigate to `/dashboard`
- **Expected:**
  - "Clicks" section has blur effect
  - PREMIUM badge overlay visible on clicks section

### Test: Premium user sees unlocked analytics

- **Preconditions:**
  - User exists with `isPremium: true`
  - User has biolink
- **Steps:**
  1. Login
  2. Navigate to `/dashboard`
- **Expected:**
  - "Clicks" section is NOT blurred
  - No PREMIUM badge overlay on clicks section

### Test: Phone preview is hidden on mobile viewport

- **Preconditions:**
  - User authenticated with biolink
- **Steps:**
  1. Set viewport to mobile (375x667)
  2. Navigate to `/dashboard`
- **Expected:**
  - Phone preview section is NOT visible
  - Stats card and links section are visible

### Test: Dashboard displays user avatar from Google

- **Preconditions:**
  - User authenticated via Google OAuth
  - User has `image` field populated
  - User has biolink
- **Steps:**
  1. Login
  2. Navigate to `/dashboard`
- **Expected:**
  - Avatar in header shows user's Google profile image
  - Avatar in phone preview shows same image

---

## 6. Dependencies & Installation

Instalar Base UI para el componente Avatar:

```bash
npm install @base-ui-components/react
```
