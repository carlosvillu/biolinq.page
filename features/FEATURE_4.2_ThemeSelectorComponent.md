# FEATURE_4.2_ThemeSelectorComponent.md

## ✅ IMPLEMENTATION STATUS: 100% COMPLETE

**Verificado en producción: Sin fallos ✅**

---

## 1. Natural Language Description

### Current State
El dashboard tiene tres secciones en la columna izquierda:
1. `StatsCard` - Muestra visitas totales (y clicks bloqueados para free users)
2. `LinksList` - Editor de links con drag & drop

El sistema de temas ya está implementado:
- `app/lib/themes.ts` define 4 temas: brutalist, light_minimal, dark_mode, colorful
- `app/services/theme.server.ts` tiene funciones `updateBiolinkTheme()` y `updateBiolinkColors()`
- La página pública ya aplica los temas correctamente

Sin embargo, **no hay forma de que el usuario cambie el tema desde el dashboard**.

### Expected End State
Después de esta tarea:
1. Nueva sección **"Customization"** debajo de `LinksList` en el dashboard
2. **Theme Selector** con grid 2x2 mostrando mini-previews de los 4 temas
3. **Color Pickers** (primary + background) debajo del selector de temas
4. Para **usuarios free**: toda la sección aparece con blur + badge "PREMIUM" (como en StatsCard)
5. Para **usuarios premium**: sección completamente funcional
6. Botón **"Save"** explícito para guardar cambios
7. El usuario debe pulsar el botón "Refresh" del `LivePreview` para ver los cambios aplicados

---

## 2. Technical Description

### High-Level Approach
1. Crear componente `ThemeSelector.tsx` usando **Base UI RadioGroup** para selección de tema
2. Crear componente `ColorPickers.tsx` con **inputs nativos type="color"**
3. Crear componente contenedor `CustomizationSection.tsx` que:
   - Muestra ambos componentes
   - Aplica blur + badge PREMIUM para usuarios free
   - Maneja el estado local y el botón "Save"
4. Crear hook `useThemeCustomization.ts` para orquestar estado y submit
5. Añadir action `updateTheme` en `dashboard.tsx` para procesar cambios
6. Actualizar el loader para incluir el tema actual del biolink

### Dependencies
- `@base-ui/react` - RadioGroup para selección de tema (ya instalado)
- Input nativo `type="color"` para color pickers (sin dependencias)

### Data Flow
```
User selects theme/colors → Local state updates → 
User clicks "Save" → Form submit (intent: updateTheme) → 
Action calls theme.server.ts → Redirect to /dashboard → 
Loader fetches updated biolink → LivePreview refreshes
```

---

## 2.1. Architecture Gate

- **Pages are puzzles:** `dashboard.tsx` solo compone componentes existentes, añade `CustomizationSection` a la columna izquierda.
- **Loaders/actions are thin:** 
  - Loader: ya obtiene biolink (incluye theme, customPrimaryColor, customBgColor)
  - Action: parsea intent `updateTheme`, llama a `updateBiolinkTheme()` y/o `updateBiolinkColors()`, retorna redirect
- **Business logic is not in components:**
  - Validación de colores y permisos premium → `app/services/theme.server.ts` (ya existe)
  - Orquestación de estado local → `app/hooks/useThemeCustomization.ts`
  - Componentes solo renderizan y wiring de hooks

### Route Module Summary
- **`dashboard.tsx`**:
  - Loader: llama `getUserBiolink()`, `getLinksByBiolinkId()` (sin cambios)
  - Action: añade handler para `intent === 'updateTheme'`
  - Component: compone `CustomizationSection` debajo de `LinksList`

### Component Summary
- **`CustomizationSection`**: wrapper con blur para free users, contiene ThemeSelector + ColorPickers + Save button
- **`ThemeSelector`**: RadioGroup con 4 ThemePreviewCard, usa hook para estado
- **`ThemePreviewCard`**: mini-preview visual de un tema (avatar + 2 link cards simulados)
- **`ColorPickers`**: dos inputs type="color" para primary y background

---

## 3. Files to Change/Create

### `app/hooks/useThemeCustomization.ts`
**Objective:** Orquestar estado local de tema y colores, manejar submit del formulario.

**Pseudocode:**
```pseudocode
HOOK useThemeCustomization
  INPUT: 
    - initialTheme: ThemeId
    - initialPrimaryColor: string | null
    - initialBgColor: string | null
    - isPremium: boolean
  
  STATE:
    - selectedTheme: ThemeId (initialized from initialTheme)
    - primaryColor: string | null (initialized from initialPrimaryColor)
    - bgColor: string | null (initialized from initialBgColor)
    - hasChanges: boolean (computed: any value differs from initial)
  
  HANDLERS:
    - setTheme(theme: ThemeId): updates selectedTheme
    - setPrimaryColor(color: string | null): updates primaryColor
    - setBgColor(color: string | null): updates bgColor
    - resetColors(): sets primaryColor and bgColor to null
  
  OUTPUT: { selectedTheme, primaryColor, bgColor, hasChanges, setTheme, setPrimaryColor, setBgColor, resetColors }
END
```

---

### `app/components/dashboard/ThemePreviewCard.tsx`
**Objective:** Renderizar mini-preview visual de un tema para el selector.

**Pseudocode:**
```pseudocode
COMPONENT ThemePreviewCard
  PROPS:
    - theme: Theme (from themes.ts)
    - isSelected: boolean
    - disabled: boolean
    - onClick: () => void
  
  RENDER:
    - Container with theme.colors.background
    - Border: 3px solid, highlighted if selected (neo-primary), else theme.colors.border
    - Shadow: hard shadow if selected
    - Content:
      - Mini avatar circle (theme.colors.primary)
      - Two mini link cards (theme.colors.cardBg with theme.colors.border)
      - Theme name below (translated via t(`theme_${theme.id}`))
    - onClick handler (if not disabled)
    - Cursor: pointer if not disabled, not-allowed if disabled
END
```

---

### `app/components/dashboard/ThemeSelector.tsx`
**Objective:** Grid 2x2 con RadioGroup de Base UI para seleccionar tema.

**Pseudocode:**
```pseudocode
COMPONENT ThemeSelector
  PROPS:
    - selectedTheme: ThemeId
    - onThemeChange: (theme: ThemeId) => void
    - disabled: boolean
  
  USES: useTranslation()
  
  RENDER:
    - Section title: t('customization_theme_title')
    - RadioGroup.Root from @base-ui/react/radio-group
      - value: selectedTheme
      - onValueChange: onThemeChange
      - disabled: disabled
    - Grid 2x2 (grid-cols-2 gap-4)
    - For each theme in THEMES:
      - RadioGroup.Item with value={theme.id}
      - ThemePreviewCard as visual representation
        - isSelected: selectedTheme === theme.id
        - disabled: disabled
END
```

---

### `app/components/dashboard/ColorPickers.tsx`
**Objective:** Dos inputs nativos type="color" para primary y background, con labels.

**Pseudocode:**
```pseudocode
COMPONENT ColorPickers
  PROPS:
    - primaryColor: string | null
    - bgColor: string | null
    - onPrimaryChange: (color: string) => void
    - onBgChange: (color: string) => void
    - onReset: () => void
    - disabled: boolean
    - defaultPrimaryColor: string (from current theme)
    - defaultBgColor: string (from current theme)
  
  USES: useTranslation()
  
  RENDER:
    - Section title: t('customization_colors_title')
    - Flex row with two color inputs:
      - Primary Color:
        - Label: t('customization_primary_color')
        - input type="color" 
        - value: primaryColor ?? defaultPrimaryColor
        - onChange: onPrimaryChange
        - Neo-brutal styling (border-3px, shadow)
      - Background Color:
        - Label: t('customization_bg_color')
        - input type="color"
        - value: bgColor ?? defaultBgColor
        - onChange: onBgChange
        - Neo-brutal styling
    - Reset button (if primaryColor or bgColor is set):
      - t('customization_reset_colors')
      - onClick: onReset
    - All inputs disabled if disabled prop is true
END
```

---

### `app/components/dashboard/CustomizationSection.tsx`
**Objective:** Contenedor que agrupa ThemeSelector + ColorPickers, aplica blur para free users.

**Pseudocode:**
```pseudocode
COMPONENT CustomizationSection
  PROPS:
    - currentTheme: ThemeId
    - customPrimaryColor: string | null
    - customBgColor: string | null
    - biolinkId: string
    - isPremium: boolean
  
  USES: 
    - useTranslation()
    - useThemeCustomization(currentTheme, customPrimaryColor, customBgColor, isPremium)
    - useFetcher() from react-router
  
  COMPUTED:
    - currentThemeConfig = getThemeById(selectedTheme)
    - isLocked = !isPremium
  
  RENDER:
    - NeoBrutalCard variant="white"
    - Header: t('customization_title')
    - Content wrapper:
      - IF isLocked: apply blur + overlay with PREMIUM badge (same pattern as StatsCard)
      - ThemeSelector
        - selectedTheme, onThemeChange: setTheme, disabled: isLocked
      - Divider (border-t)
      - ColorPickers
        - primaryColor, bgColor, handlers, disabled: isLocked
        - defaultPrimaryColor: currentThemeConfig.colors.primary
        - defaultBgColor: currentThemeConfig.colors.background
    - Footer (outside blur):
      - fetcher.Form with hidden inputs:
        - intent: "updateTheme"
        - biolinkId
        - theme: selectedTheme
        - primaryColor (if set)
        - bgColor (if set)
      - Save button:
        - Disabled if !hasChanges or isLocked or fetcher.state !== 'idle'
        - Text: fetcher.state === 'submitting' ? t('saving') : t('customization_save')
        - Neo-brutal primary button style
END
```

---

### `app/components/dashboard/index.ts`
**Objective:** Exportar nuevos componentes.

**Pseudocode:**
```pseudocode
ADD EXPORTS:
  - export { CustomizationSection } from './CustomizationSection'
  // ThemeSelector, ThemePreviewCard, ColorPickers are internal, not exported
END
```

---

### `app/routes/dashboard.tsx`
**Objective:** Añadir action handler para `updateTheme` y renderizar `CustomizationSection`.

**Pseudocode:**
```pseudocode
LOADER (no changes needed):
  - biolink already includes: theme, customPrimaryColor, customBgColor

ACTION:
  ADD handler for intent === 'updateTheme':
    - Parse: theme, primaryColor, bgColor, biolinkId from formData
    - Validate theme is valid ThemeId
    - Call updateBiolinkTheme(biolinkId, theme)
    - IF primaryColor or bgColor provided:
      - Call updateBiolinkColors(biolinkId, { primaryColor, bgColor })
      - IF result.error === 'PREMIUM_REQUIRED':
        - Return data({ error: 'PREMIUM_REQUIRED' })
    - Return redirect('/dashboard')

COMPONENT:
  ADD after LinksList in left column:
    - CustomizationSection
      - currentTheme: biolink.theme
      - customPrimaryColor: biolink.customPrimaryColor
      - customBgColor: biolink.customBgColor
      - biolinkId: biolink.id
      - isPremium: user.isPremium
END
```

---

## 4. I18N

### Existing keys to reuse
- `theme_brutalist` - "Brutalist" / "Brutalista"
- `theme_light_minimal` - "Light Minimal" / "Minimalista Claro"
- `theme_dark_mode` - "Dark Mode" / "Modo Oscuro"
- `theme_colorful` - "Colorful" / "Colorido"
- `saving` - "Saving..." / "Guardando..."
- `cancel` - "Cancel" / "Cancelar"

### New keys to create

| Key | English | Spanish |
|-----|---------|---------|
| `customization_title` | Customization | Personalización |
| `customization_theme_title` | Theme | Tema |
| `customization_colors_title` | Custom Colors | Colores Personalizados |
| `customization_primary_color` | Primary Color | Color Principal |
| `customization_bg_color` | Background Color | Color de Fondo |
| `customization_reset_colors` | Reset to theme defaults | Restablecer colores del tema |
| `customization_save` | Save Changes | Guardar Cambios |
| `customization_premium_required` | Premium required to customize | Se requiere Premium para personalizar |
| `theme_error_invalid` | Invalid theme selected | Tema seleccionado inválido |
| `theme_error_premium_colors` | Custom colors require Premium | Los colores personalizados requieren Premium |

---

## 5. E2E Test Plan

### Test: Free user sees customization section with blur and PREMIUM badge
- **Preconditions:** User is logged in, has biolink, is NOT premium
- **Steps:**
  1. Navigate to `/dashboard`
  2. Scroll to Customization section
- **Expected:**
  - Section is visible with blur effect
  - PREMIUM badge overlay is displayed
  - Theme cards are not clickable
  - Color pickers are disabled
  - Save button is disabled

### Test: Premium user can select a different theme
- **Preconditions:** User is logged in, has biolink, IS premium, current theme is "brutalist"
- **Steps:**
  1. Navigate to `/dashboard`
  2. Click on "Light Minimal" theme card
  3. Click "Save Changes" button
- **Expected:**
  - Theme card shows selected state (highlighted border)
  - Save button becomes enabled after selection
  - After save, page reloads
  - Biolink theme is updated to "light_minimal" in database
  - After clicking "Refresh preview" button, LivePreview iframe shows updated theme

### Test: Premium user can customize colors
- **Preconditions:** User is logged in, has biolink, IS premium
- **Steps:**
  1. Navigate to `/dashboard`
  2. Click primary color picker, select #FF0000
  3. Click background color picker, select #00FF00
  4. Click "Save Changes"
- **Expected:**
  - Color pickers show selected colors
  - Save button is enabled
  - After save, biolink has customPrimaryColor=#FF0000, customBgColor=#00FF00
  - LivePreview shows custom colors

### Test: Premium user can reset custom colors
- **Preconditions:** User is logged in, has biolink, IS premium, has custom colors set
- **Steps:**
  1. Navigate to `/dashboard`
  2. Click "Reset to theme defaults" button
  3. Click "Save Changes"
- **Expected:**
  - Color pickers revert to theme default colors
  - After save, biolink has customPrimaryColor=null, customBgColor=null

### Test: Free user cannot save theme changes (backend validation)
- **Preconditions:** User is logged in, has biolink, is NOT premium
- **Steps:**
  1. Manually submit form with custom colors (bypass UI)
- **Expected:**
  - Server returns error "PREMIUM_REQUIRED"
  - No changes saved to database

---

## 6. Implementation Notes

### Base UI RadioGroup Usage
```tsx
import { RadioGroup } from '@base-ui/react/radio-group'

<RadioGroup.Root value={selectedTheme} onValueChange={setTheme}>
  {Object.values(THEMES).map((theme) => (
    <RadioGroup.Item key={theme.id} value={theme.id}>
      <ThemePreviewCard theme={theme} isSelected={selectedTheme === theme.id} />
    </RadioGroup.Item>
  ))}
</RadioGroup.Root>
```

### Blur Pattern (from StatsCard)
```tsx
<div className={cn(
  'relative',
  !isPremium && 'opacity-50 blur-[1px] select-none cursor-not-allowed'
)}>
  {/* Content */}
  {!isPremium && (
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="bg-neo-accent text-white text-xs font-bold px-2 py-1 border border-neo-dark shadow-sm">
        PREMIUM
      </span>
    </div>
  )}
</div>
```

### Native Color Input Styling
```tsx
<input
  type="color"
  value={color}
  onChange={(e) => onChange(e.target.value)}
  className="w-12 h-12 border-[3px] border-neo-dark rounded cursor-pointer shadow-hard"
/>
```
