# FEATURE_3.6_LivePreview.md

## 1. Natural Language Description

### Current State
El dashboard muestra un preview estático del perfil público del usuario usando el componente `PhonePreview.tsx`. Este componente renderiza `ProfilePreviewContent.tsx` dentro de un frame de iPhone, mostrando los datos en tiempo real desde React pero sin usar la página pública real (`/:username`).

El preview actual:
- Muestra datos "en vivo" desde el state de React
- Usa componentes internos que imitan el diseño de la página pública
- No refleja exactamente cómo se ve la página pública real

### Expected End State
El dashboard mostrará un **iframe real** cargando la página pública del usuario (`/:username`) dentro del frame de iPhone. Esto garantiza que el preview sea 100% fiel a lo que verán los visitantes.

Cambios principales:
- Nuevo componente `LivePreview.tsx` que reemplaza a `PhonePreview.tsx`
- El iframe carga `/:username` (la página pública real)
- Botón "Refresh Preview" junto al indicador "Live preview"
- Spinner de carga mientras el iframe carga
- Iframe con sandboxing de seguridad apropiado
- Eliminar `ProfilePreviewContent.tsx` (ya no se usa)

---

## 2. Technical Description

### Approach
Crear un nuevo componente `LivePreview` que reutiliza el frame de iPhone existente de `PhonePreview` pero reemplaza el contenido estático por un iframe que carga la página pública real.

### Key Decisions
1. **Iframe src:** `/${biolink.username}` - La URL relativa de la página pública
2. **Refresh:** Botón manual junto al indicador "Live preview" (no auto-refresh)
3. **Loading state:** Spinner simple centrado mientras carga
4. **Error state:** Mensaje de error si el iframe falla (sin fallback a preview estático)
5. **Sandbox:** `sandbox="allow-scripts allow-same-origin"` para seguridad

### Data Flow
1. `dashboard.tsx` loader obtiene `biolink.username`
2. Pasa `username` a `LivePreview` (en lugar de `links`)
3. `LivePreview` construye URL `/${username}` para el iframe
4. Usuario puede hacer click en "Refresh" para recargar el iframe

### Dependencies
- No se requieren nuevas dependencias
- Se usa el estado local de React para loading/error

---

## 2.1. Architecture Gate

- **Pages are puzzles:** ✅ `dashboard.tsx` solo compone componentes, no tiene lógica de UI.
- **Loaders/actions are thin:** ✅ El loader ya obtiene `biolink` que incluye `username`. No hay cambios en loader/action.
- **Business logic is not in components:** ✅ `LivePreview` solo maneja estado de UI (loading, refresh). No hay lógica de dominio.

### Route Module: `dashboard.tsx`
- **Loader:** Obtiene user, biolink, links (sin cambios)
- **Action:** Maneja create/delete/reorder links (sin cambios)
- **Component:** Compone `PremiumBanner`, `StatsCard`, `LinksList`, `LivePreview`

### Component: `LivePreview.tsx`
- **Hooks que usa:** `useState` (loading state), `useRef` (iframe ref), `useTranslation` (i18n)
- **Business logic:** NINGUNA - solo renderizado y estado de UI

---

## 3. Files to Change/Create

### `app/components/dashboard/LivePreview.tsx` (CREATE)

**Objective:** Nuevo componente que renderiza un iframe con la página pública del usuario dentro del frame de iPhone.

**Pseudocode:**
```pseudocode
COMPONENT LivePreview
  PROPS: username (string)

  STATE:
    isLoading: boolean = true
    loadError: boolean = false
    refreshKey: number = 0  // Para forzar recarga del iframe

  REF:
    iframeRef: HTMLIFrameElement | null

  COMPUTED:
    iframeSrc = `/${username}?t=${refreshKey}`  // Cache busting

  HANDLERS:
    handleRefresh():
      SET isLoading = true
      SET loadError = false
      SET refreshKey = refreshKey + 1

    handleIframeLoad():
      SET isLoading = false

    handleIframeError():
      SET isLoading = false
      SET loadError = true

  RENDER:
    <div sticky top-8 flex-col items-center (hidden on mobile)>
      {/* Header con indicador y botón refresh */}
      <div flex items-center gap-2 mb-4>
        <div green dot pulsing />
        <span "Live preview" />
        <button onClick={handleRefresh} aria-label={t('dashboard_refresh_preview')}>
          <RefreshIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Phone Frame (copiado de PhonePreview) */}
      <div iPhone-frame 320x640 border-4 rounded-[2.5rem]>
        {/* Screen con iframe */}
        <div screen bg-white rounded-[2rem] overflow-hidden relative>
          {/* Loading spinner */}
          IF isLoading:
            <div absolute inset-0 flex items-center justify-center bg-white z-10>
              <Spinner />
            </div>

          {/* Error state */}
          IF loadError AND NOT isLoading:
            <div absolute inset-0 flex items-center justify-center bg-white>
              <p error message />
            </div>

          {/* Iframe */}
          <iframe
            ref={iframeRef}
            key={refreshKey}
            src={iframeSrc}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title={t('dashboard_live_preview')}
          />
        </div>

        {/* Notch */}
        <div notch />
      </div>
    </div>
END
```

---

### `app/components/dashboard/index.ts` (MODIFY)

**Objective:** Exportar `LivePreview` en lugar de `PhonePreview`.

**Pseudocode:**
```pseudocode
BEFORE:
  export { PhonePreview } from './PhonePreview'

AFTER:
  export { LivePreview } from './LivePreview'
  // Eliminar export de PhonePreview
```

---

### `app/routes/dashboard.tsx` (MODIFY)

**Objective:** Usar `LivePreview` en lugar de `PhonePreview`, pasar `username` en lugar de props de usuario.

**Pseudocode:**
```pseudocode
IMPORT:
  BEFORE: import { ..., PhonePreview } from '~/components/dashboard'
  AFTER:  import { ..., LivePreview } from '~/components/dashboard'

COMPONENT DashboardPage:
  RENDER Right Column:
    BEFORE:
      <PhonePreview
        userName={user.name}
        userImage={user.image}
        links={links}
      />

    AFTER:
      <LivePreview username={biolink.username} />
```

---

### `app/components/dashboard/PhonePreview.tsx` (DELETE)

**Objective:** Eliminar el componente obsoleto.

**Action:** Eliminar archivo completo.

---

### `app/components/dashboard/ProfilePreviewContent.tsx` (DELETE)

**Objective:** Eliminar el componente de contenido estático que ya no se usa.

**Action:** Eliminar archivo completo.

---

## 4. I18N

### Existing keys to reuse
- `dashboard_live_preview` - "Live Preview" (ya existe)

### New keys to create

| Key | English | Spanish |
|-----|---------|---------|
| `dashboard_refresh_preview` | Refresh preview | Actualizar preview |
| `dashboard_preview_loading` | Loading preview... | Cargando preview... |
| `dashboard_preview_error` | Could not load preview | No se pudo cargar el preview |

---

## 5. E2E Test Plan

### Test: Dashboard shows live iframe preview of user's public page

**Preconditions:**
- Usuario autenticado con biolink y username `testuser`
- Al menos 1 link creado

**Steps:**
1. Navegar a `/dashboard`
2. Esperar a que el dashboard cargue
3. Verificar que existe un iframe dentro del preview
4. Verificar que el iframe tiene src que contiene `/${username}`

**Expected:**
- El iframe es visible en desktop (viewport >= 1024px)
- El iframe src apunta a la página pública del usuario
- El indicador "Live preview" es visible

---

### Test: Refresh button reloads the iframe content

**Preconditions:**
- Usuario autenticado con biolink
- Dashboard visible en desktop

**Steps:**
1. Navegar a `/dashboard`
2. Obtener el `src` actual del iframe
3. Click en el botón de refresh (icono de recarga junto a "Live preview")
4. Esperar a que el iframe recargue
5. Obtener el nuevo `src` del iframe

**Expected:**
- El `src` del iframe cambia (incluye nuevo timestamp para cache busting)
- El spinner de loading aparece brevemente
- El iframe muestra contenido actualizado

---

### Test: Loading spinner shows while iframe loads

**Preconditions:**
- Usuario autenticado con biolink
- Dashboard en desktop viewport

**Steps:**
1. Navegar a `/dashboard`
2. Observar el estado inicial del preview

**Expected:**
- Un spinner de carga es visible mientras el iframe carga
- El spinner desaparece cuando el iframe termina de cargar

---

### Test: Live preview is hidden on mobile

**Preconditions:**
- Usuario autenticado con biolink

**Steps:**
1. Configurar viewport a 375x667 (móvil)
2. Navegar a `/dashboard`

**Expected:**
- El componente LivePreview no es visible (hidden en mobile)
- Solo se muestra la columna de links editor

---

## 6. Files Summary

| File | Action | Description |
|------|--------|-------------|
| `app/components/dashboard/LivePreview.tsx` | CREATE | Nuevo componente con iframe |
| `app/components/dashboard/index.ts` | MODIFY | Cambiar export |
| `app/routes/dashboard.tsx` | MODIFY | Usar LivePreview |
| `app/components/dashboard/PhonePreview.tsx` | DELETE | Componente obsoleto |
| `app/components/dashboard/ProfilePreviewContent.tsx` | DELETE | Componente obsoleto |
| `app/locales/en.json` | MODIFY | Agregar 3 keys |
| `app/locales/es.json` | MODIFY | Agregar 3 keys |
| `tests/e2e/live-preview.spec.ts` | CREATE | Tests E2E |
