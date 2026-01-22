# FEATURE_LoadTimeIndicator.md

## 1. Natural Language Description

### Current State
La página pública de usuario (`/:username`) muestra el perfil del usuario con sus links. Actualmente no hay ninguna indicación visual del rendimiento de carga de la página.

### Expected End State
La página pública mostrará un indicador discreto en la parte inferior central que dice "Esta página cargó en XXXms", donde XXX es el tiempo real de carga medido con la Performance API del navegador. El indicador:
- Es visible para **todos los usuarios** (no solo premium)
- Permanece **siempre visible** en la página
- Usa un estilo **discreto pero no invisible** - visible al mirar, pero no distrae del contenido principal
- Respeta el tema activo del usuario (colores dinámicos)

---

## 2. Technical Description

### Approach
Crearemos un componente `LoadTimeIndicator` que:
1. Usa `useEffect` para calcular el tiempo de carga cuando el DOM está completamente cargado
2. Utiliza `performance.timing.loadEventEnd - performance.timing.navigationStart` para el cálculo
3. Se renderiza con estado inicial vacío y muestra el tiempo una vez calculado
4. Recibe el tema como prop para adaptar colores dinámicamente

### Architecture Decision
- **Componente puro en `app/components/public/`**: Solo renderiza UI, sin lógica de negocio
- El cálculo de performance se hace dentro del componente con un custom hook simple
- No se necesita servicio ni acceso a DB - es puramente client-side

---

## 2.1. Architecture Gate

- **Pages are puzzles:** El route module `public.tsx` solo compone componentes existentes. Solo añadiremos el nuevo componente al árbol.
- **Loaders/actions are thin:** No hay cambios en loader/action - esta feature es 100% client-side.
- **Business logic is not in components:** No hay lógica de negocio. Solo un cálculo de performance nativo del browser que vive en un hook local.

---

## 3. Files to Change/Create

### `app/components/public/LoadTimeIndicator.tsx`
**Objective:** Componente que muestra el tiempo de carga de la página de forma discreta.

**Pseudocode:**
```pseudocode
COMPONENT LoadTimeIndicator
  PROPS: theme (Theme)

  STATE: loadTime (number | null, default null)

  EFFECT on mount:
    IF window.performance AND performance.timing exist:
      FUNCTION calculateLoadTime:
        loadTime = timing.loadEventEnd - timing.navigationStart
        IF loadTime > 0:
          SET loadTime state
        ELSE:
          // Page still loading, retry on 'load' event
          ADD event listener 'load' → recalculate

      IF document.readyState === 'complete':
        calculateLoadTime()
      ELSE:
        ADD event listener 'load' → calculateLoadTime

  RENDER:
    IF loadTime is null:
      RETURN null (don't render anything)

    RETURN:
      <div> positioned: fixed bottom center
        <span> with theme-aware muted styling:
          t('public_load_time', { time: loadTime })
        </span>
      </div>
```

**Styling notes:**
- Posición: fixed, bottom-4, centrado horizontalmente
- Font: `font-mono text-xs`
- Color: `var(--theme-text-muted)` para ser discreto
- Opacity: ~60% para no competir con el contenido
- Z-index: bajo (z-10), debajo del watermark

---

### `app/components/public/PublicProfile.tsx`
**Objective:** Añadir el componente `LoadTimeIndicator` al layout.

**Pseudocode:**
```pseudocode
COMPONENT PublicProfile (existing)

  RENDER:
    <main> ... existing content ...
      <div className="w-full max-w-md">
        ... avatar, name, links ...
      </div>

      {!user.isPremium && <Watermark theme={theme} />}

      // NEW: Add load time indicator for all users
      <LoadTimeIndicator theme={theme} />
    </main>
```

---

## 4. I18N Section

### Existing keys to reuse
- Ninguna aplicable

### New keys to create

| Key | English | Spanish |
|-----|---------|---------|
| `public_load_time` | This page loaded in {{time}}ms | Esta página cargó en {{time}}ms |

---

## 5. E2E Test Plan

### Test: Load time indicator appears on public profile page
- **Preconditions:** User has claimed username and has at least one link
- **Steps:**
  1. Navigate to public profile page `/:username`
  2. Wait for page to fully load
- **Expected:**
  - Load time indicator appears at bottom center of page
  - Shows text "This page loaded in Xms" where X is a positive number
  - Indicator is visible but subtle (muted color, small text)

### Test: Load time indicator is visible regardless of premium status
- **Preconditions:** Two users - one premium, one free
- **Steps:**
  1. Navigate to free user's public profile
  2. Verify indicator is visible
  3. Navigate to premium user's public profile
  4. Verify indicator is visible
- **Expected:** Both profiles show the load time indicator

---

## Implementation Notes

- La API `performance.timing` está deprecated pero sigue funcionando en todos los browsers modernos. La alternativa `performance.getEntriesByType('navigation')` es más moderna pero requiere más código. Dado que `timing` funciona y es más simple, lo usaremos.
- El indicador no aparece durante SSR (loadTime es null) - solo se muestra después de hidratación y cálculo del tiempo.
