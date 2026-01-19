# FEATURE_4.1_ThemeConfiguration.md

## 1. Natural Language Description

### Estado Actual

La página pública (`/:username`) tiene un único estilo visual hardcodeado: Neo-Brutal con colores fijos (`bg-canvas`, `border-neo-dark`, etc.). El schema de base de datos ya tiene:

- `theme` (enum: `brutalist`, `light_minimal`, `dark_mode`, `colorful`)
- `customPrimaryColor` (varchar, nullable)
- `customBgColor` (varchar, nullable)

Pero estos campos no se utilizan en el renderizado.

### Estado Final

El sistema de temas será **plug-and-play** para la página pública:

1. **4 temas completos** con Look & Feel diferenciado (no solo colores):
   - **Brutalist** - Neo-Brutal actual (bordes gruesos, sombras duras, tipografía bold)
   - **Light Minimal** - Limpio, sin sombras, mucho whitespace, tipografía ligera
   - **Dark Mode** - Fondo oscuro, acentos neón, estética cyberpunk suave
   - **Colorful** - Gradientes suaves, bordes redondeados, estética playful

2. **Cada tema define**:
   - Colores (background, text, primary, accent, border)
   - Tipografía (font-family, weights)
   - Bordes (width, radius)
   - Sombras (tipo, intensidad)
   - Animaciones (hover effects)

3. **Aislamiento total**: Los temas SOLO afectan a `PublicProfile`, `PublicLinkCard`, y `Watermark`. El resto de la app (dashboard, landing, auth) permanece intacto.

4. **Custom colors**: `customPrimaryColor` y `customBgColor` sobrescriben los valores del tema base cuando están definidos.

---

## 2. Technical Description

### Arquitectura del Sistema de Temas

```
app/lib/themes.ts          → Definiciones de temas (constantes + tipos)
app/lib/theme-styles.ts    → Funciones que generan clases CSS por tema
app/components/public/     → Componentes que consumen el tema via props
```

### Estrategia de Aislamiento

Los temas se aplican mediante **CSS variables scoped** en un contenedor wrapper. El componente `PublicProfile` recibe el tema y aplica las variables CSS inline, que luego son consumidas por los componentes hijos.

```tsx
// Ejemplo de aislamiento
<div style={{ '--theme-bg': '#121212', '--theme-text': '#fff', ... }}>
  {/* Solo este árbol usa las variables de tema */}
</div>
```

### Estructura de un Tema

```typescript
type Theme = {
  id: ThemeId
  name: string
  
  // Colores (customizables)
  colors: {
    background: string      // Fondo principal
    text: string            // Texto principal
    textMuted: string       // Texto secundario
    primary: string         // Botones, acentos principales
    primaryText: string     // Texto sobre primary
    border: string          // Color de bordes
    cardBg: string          // Fondo de cards
    shadow: string          // Color de sombras
  }
  
  // Look & Feel (NO customizables)
  style: {
    fontFamily: 'sans' | 'mono' | 'display'
    fontWeight: 'normal' | 'medium' | 'bold'
    borderWidth: '0' | '1px' | '2px' | '3px'
    borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full'
    shadowType: 'none' | 'soft' | 'hard' | 'glow'
    shadowOffset: string    // e.g., '2px 2px' or '0 4px 12px'
    hoverEffect: 'none' | 'lift' | 'scale' | 'glow'
    avatarStyle: 'circle' | 'rounded' | 'square'
  }
}
```

### Dependencias

- No se requieren nuevas dependencias
- Se usa Tailwind CSS 4 con variables CSS inline

---

## 2.1. Architecture Gate

- **Pages are puzzles:** `public.tsx` solo compone `PublicProfile` y pasa datos del loader. Sin lógica de temas.
- **Loaders/actions are thin:** El loader ya retorna `biolink` con `theme`, `customPrimaryColor`, `customBgColor`. No hay cambios.
- **Business logic is not in components:**
  - Lógica de resolución de tema → `app/lib/themes.ts` (pure functions)
  - Generación de estilos → `app/lib/theme-styles.ts` (pure functions)
  - Componentes solo consumen y renderizan

### Componentes afectados

| Componente | Cambios |
|------------|---------|
| `PublicProfile.tsx` | Recibe tema, aplica wrapper con CSS variables |
| `PublicLinkCard.tsx` | Usa CSS variables del tema (no props directos) |
| `Watermark.tsx` | Usa CSS variables del tema |
| `PublicNotFound.tsx` | Sin cambios (usa estilos globales de la app) |
| `PublicError.tsx` | Sin cambios |

---

## 3. Files to Change/Create

### `app/lib/themes.ts` (CREATE)

**Objective:** Definir los 4 temas con su Look & Feel completo. Exportar tipos, constantes, y helpers.

**Pseudocode:**

```pseudocode
// Types
TYPE ThemeId = 'brutalist' | 'light_minimal' | 'dark_mode' | 'colorful'

TYPE ThemeColors = {
  background, text, textMuted, primary, primaryText, 
  border, cardBg, shadow
}

TYPE ThemeStyle = {
  fontFamily, fontWeight, borderWidth, borderRadius,
  shadowType, shadowOffset, hoverEffect, avatarStyle
}

TYPE Theme = {
  id: ThemeId
  name: string
  colors: ThemeColors
  style: ThemeStyle
}

// Theme Definitions
CONST THEMES: Record<ThemeId, Theme> = {
  brutalist: {
    id: 'brutalist'
    name: 'Brutalist'
    colors: {
      background: '#FFFDF8'    // Canvas cream
      text: '#111827'          // Ink black
      textMuted: '#6B7280'     // Gray 500
      primary: '#ffc480'       // Neo orange
      primaryText: '#111827'   // Dark on orange
      border: '#111827'        // Ink black
      cardBg: '#FFFFFF'        // Pure white
      shadow: '#111827'        // Solid black shadow
    }
    style: {
      fontFamily: 'sans'
      fontWeight: 'bold'
      borderWidth: '3px'
      borderRadius: 'sm'       // 4px
      shadowType: 'hard'
      shadowOffset: '4px 4px'
      hoverEffect: 'lift'
      avatarStyle: 'circle'
    }
  }
  
  light_minimal: {
    id: 'light_minimal'
    name: 'Light Minimal'
    colors: {
      background: '#FAFAFA'    // Almost white
      text: '#1F2937'          // Gray 800
      textMuted: '#9CA3AF'     // Gray 400
      primary: '#111827'       // Dark button
      primaryText: '#FFFFFF'   // White on dark
      border: '#E5E7EB'        // Gray 200
      cardBg: '#FFFFFF'        // Pure white
      shadow: 'rgba(0,0,0,0.05)' // Subtle shadow
    }
    style: {
      fontFamily: 'sans'
      fontWeight: 'medium'
      borderWidth: '1px'
      borderRadius: 'lg'       // 12px
      shadowType: 'soft'
      shadowOffset: '0 4px 12px'
      hoverEffect: 'scale'
      avatarStyle: 'circle'
    }
  }
  
  dark_mode: {
    id: 'dark_mode'
    name: 'Dark Mode'
    colors: {
      background: '#0F0F0F'    // Near black
      text: '#F9FAFB'          // Gray 50
      textMuted: '#9CA3AF'     // Gray 400
      primary: '#22D3EE'       // Cyan 400 (neon accent)
      primaryText: '#0F0F0F'   // Dark on neon
      border: '#374151'        // Gray 700
      cardBg: '#1F1F1F'        // Slightly lighter
      shadow: 'rgba(34,211,238,0.2)' // Cyan glow
    }
    style: {
      fontFamily: 'mono'
      fontWeight: 'medium'
      borderWidth: '1px'
      borderRadius: 'md'       // 8px
      shadowType: 'glow'
      shadowOffset: '0 0 20px'
      hoverEffect: 'glow'
      avatarStyle: 'rounded'
    }
  }
  
  colorful: {
    id: 'colorful'
    name: 'Colorful'
    colors: {
      background: '#FDF4FF'    // Fuchsia 50 (soft pink)
      text: '#581C87'          // Purple 900
      textMuted: '#A855F7'     // Purple 500
      primary: '#E879F9'       // Fuchsia 400
      primaryText: '#FFFFFF'   // White
      border: '#F0ABFC'        // Fuchsia 300
      cardBg: '#FFFFFF'        // White
      shadow: 'rgba(232,121,249,0.3)' // Pink shadow
    }
    style: {
      fontFamily: 'sans'
      fontWeight: 'bold'
      borderWidth: '2px'
      borderRadius: 'full'     // pill shape
      shadowType: 'soft'
      shadowOffset: '0 8px 24px'
      hoverEffect: 'scale'
      avatarStyle: 'circle'
    }
  }
}

// Helpers
FUNCTION getThemeById(id: ThemeId): Theme
  RETURN THEMES[id] ?? THEMES['light_minimal']
END

FUNCTION resolveThemeColors(
  theme: Theme,
  customPrimaryColor?: string | null,
  customBgColor?: string | null
): ThemeColors
  RETURN {
    ...theme.colors,
    primary: customPrimaryColor ?? theme.colors.primary,
    background: customBgColor ?? theme.colors.background
  }
END

EXPORT { THEMES, getThemeById, resolveThemeColors, ThemeId, Theme, ThemeColors, ThemeStyle }
```

---

### `app/lib/theme-styles.ts` (CREATE)

**Objective:** Generar CSS variables y clases Tailwind basadas en el tema resuelto. Mantener la lógica de estilos separada de los componentes.

**Pseudocode:**

```pseudocode
IMPORT { Theme, ThemeColors, ThemeStyle } from './themes'

TYPE ThemeCSSVariables = Record<string, string>

// Genera las CSS variables para aplicar inline en el wrapper
FUNCTION getThemeCSSVariables(colors: ThemeColors): ThemeCSSVariables
  RETURN {
    '--theme-bg': colors.background,
    '--theme-text': colors.text,
    '--theme-text-muted': colors.textMuted,
    '--theme-primary': colors.primary,
    '--theme-primary-text': colors.primaryText,
    '--theme-border': colors.border,
    '--theme-card-bg': colors.cardBg,
    '--theme-shadow': colors.shadow,
  }
END

// Mapea style config a clases Tailwind
FUNCTION getThemeClasses(style: ThemeStyle): {
  container: string
  avatar: string
  card: string
  cardHover: string
  text: string
  textMuted: string
}
  // Font family mapping
  fontClass = SWITCH style.fontFamily
    'sans' -> 'font-sans'
    'mono' -> 'font-mono'
    'display' -> 'font-sans' // fallback
  END
  
  // Font weight mapping
  weightClass = SWITCH style.fontWeight
    'normal' -> 'font-normal'
    'medium' -> 'font-medium'
    'bold' -> 'font-bold'
  END
  
  // Border radius mapping
  radiusClass = SWITCH style.borderRadius
    'none' -> 'rounded-none'
    'sm' -> 'rounded'
    'md' -> 'rounded-lg'
    'lg' -> 'rounded-xl'
    'full' -> 'rounded-full'
  END
  
  // Avatar radius
  avatarRadius = SWITCH style.avatarStyle
    'circle' -> 'rounded-full'
    'rounded' -> 'rounded-xl'
    'square' -> 'rounded-lg'
  END
  
  // Hover effect classes
  hoverClass = SWITCH style.hoverEffect
    'none' -> ''
    'lift' -> 'group-hover:-translate-y-1 group-hover:-translate-x-1'
    'scale' -> 'group-hover:scale-[1.02]'
    'glow' -> 'group-hover:shadow-[0_0_30px_var(--theme-shadow)]'
  END
  
  RETURN {
    container: `${fontClass}`,
    avatar: `${avatarRadius}`,
    card: `${radiusClass} ${weightClass}`,
    cardHover: hoverClass,
    text: weightClass,
    textMuted: 'font-normal'
  }
END

// Genera el estilo de sombra basado en el tema
FUNCTION getThemeShadowStyle(style: ThemeStyle): React.CSSProperties
  IF style.shadowType == 'none'
    RETURN {}
  END
  
  IF style.shadowType == 'hard'
    RETURN { 
      boxShadow: `${style.shadowOffset} 0 0 var(--theme-shadow)` 
    }
  END
  
  IF style.shadowType == 'soft' OR style.shadowType == 'glow'
    RETURN { 
      boxShadow: `${style.shadowOffset} var(--theme-shadow)` 
    }
  END
END

// Genera el estilo de borde
FUNCTION getThemeBorderStyle(style: ThemeStyle): string
  IF style.borderWidth == '0'
    RETURN 'border-0'
  END
  RETURN `border-[${style.borderWidth}]`
END

EXPORT { 
  getThemeCSSVariables, 
  getThemeClasses, 
  getThemeShadowStyle,
  getThemeBorderStyle,
  ThemeCSSVariables 
}
```

---

### `app/components/public/PublicProfile.tsx` (MODIFY)

**Objective:** Recibir el tema del biolink, resolver colores custom, y aplicar CSS variables en un wrapper que aísla los estilos del resto de la app.

**Pseudocode:**

```pseudocode
IMPORT { getThemeById, resolveThemeColors } from '~/lib/themes'
IMPORT { getThemeCSSVariables, getThemeClasses, getThemeShadowStyle } from '~/lib/theme-styles'

TYPE Props = {
  user: { name, image, isPremium }
  biolink: { 
    username, 
    theme,                    // NEW: ThemeId
    customPrimaryColor,       // NEW: string | null
    customBgColor             // NEW: string | null
  }
  links: Link[]
  isPreview?: boolean
}

COMPONENT PublicProfile(props)
  // 1. Resolve theme
  theme = getThemeById(props.biolink.theme)
  colors = resolveThemeColors(
    theme, 
    props.biolink.customPrimaryColor, 
    props.biolink.customBgColor
  )
  
  // 2. Generate styles
  cssVars = getThemeCSSVariables(colors)
  classes = getThemeClasses(theme.style)
  avatarShadow = getThemeShadowStyle(theme.style)
  
  // 3. Render with scoped CSS variables
  RENDER (
    <main 
      className={`min-h-screen flex flex-col items-center px-4 py-12 ${classes.container}`}
      style={{ 
        ...cssVars,
        backgroundColor: 'var(--theme-bg)',
        color: 'var(--theme-text)'
      }}
    >
      <div className="w-full max-w-md">
        {/* Avatar with theme-aware styling */}
        <div className="flex flex-col items-center mb-8">
          <div 
            className={`w-24 h-24 ${classes.avatar} overflow-hidden 
              flex items-center justify-center mb-4`}
            style={{
              backgroundColor: 'var(--theme-card-bg)',
              borderWidth: theme.style.borderWidth,
              borderColor: 'var(--theme-border)',
              ...avatarShadow
            }}
          >
            {/* Avatar content */}
          </div>
          
          <h1 className={`text-2xl ${classes.text} text-center`}>
            {displayName}
          </h1>
          <p className="font-mono text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            @{biolink.username}
          </p>
        </div>
        
        {/* Links */}
        <div className="space-y-4">
          {links.map(link => (
            <PublicLinkCard 
              key={link.id} 
              link={link} 
              theme={theme}      // Pass theme to child
              isPreview={isPreview} 
            />
          ))}
        </div>
      </div>
      
      {!user.isPremium && <Watermark theme={theme} />}
    </main>
  )
END
```

---

### `app/components/public/PublicLinkCard.tsx` (MODIFY)

**Objective:** Usar CSS variables del tema padre y aplicar estilos de card según el tema.

**Pseudocode:**

```pseudocode
IMPORT { Theme } from '~/lib/themes'
IMPORT { getThemeClasses, getThemeShadowStyle, getThemeBorderStyle } from '~/lib/theme-styles'

TYPE Props = {
  link: { id, title, url, emoji }
  theme: Theme              // NEW: recibe el tema
  isPreview?: boolean
}

COMPONENT PublicLinkCard(props)
  classes = getThemeClasses(props.theme.style)
  shadowStyle = getThemeShadowStyle(props.theme.style)
  borderClass = getThemeBorderStyle(props.theme.style)
  
  // Para temas con sombra 'hard', usamos el patrón de shadow layer
  // Para otros temas, usamos box-shadow CSS
  useShadowLayer = props.theme.style.shadowType == 'hard'
  
  RENDER (
    <a
      href={isPreview ? link.url : `/go/${link.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block w-full"
    >
      {/* Shadow Layer - Solo para tema brutalist */}
      IF useShadowLayer THEN
        <div 
          className={`absolute inset-0 ${classes.card} transition-transform duration-200`}
          style={{ 
            backgroundColor: 'var(--theme-shadow)',
            transform: `translate(${props.theme.style.shadowOffset})`
          }}
        />
      END
      
      {/* Card Face */}
      <div
        className={`relative z-10 ${classes.card} ${borderClass} py-5 px-6
          flex items-center justify-center gap-3
          transition-all duration-200 ease-out
          ${classes.cardHover}`}
        style={{
          backgroundColor: 'var(--theme-card-bg)',
          borderColor: 'var(--theme-border)',
          ...(!useShadowLayer ? shadowStyle : {})
        }}
      >
        {link.emoji && <span className="text-2xl">{link.emoji}</span>}
        <span className={`${classes.text} text-lg tracking-tight`}>
          {link.title}
        </span>
      </div>
    </a>
  )
END
```

---

### `app/components/public/Watermark.tsx` (MODIFY)

**Objective:** Adaptar el watermark al tema actual para que no desentone visualmente.

**Pseudocode:**

```pseudocode
IMPORT { Theme } from '~/lib/themes'

TYPE Props = {
  theme: Theme    // NEW
}

COMPONENT Watermark(props)
  // El watermark debe ser sutil pero visible en cualquier tema
  // Usamos el color de texto muted del tema
  
  RENDER (
    <div 
      className="mt-12 text-center"
      style={{ color: 'var(--theme-text-muted)' }}
    >
      <a 
        href="https://biolinq.page"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium opacity-60 hover:opacity-100 transition-opacity"
      >
        Made with BioLinq
      </a>
    </div>
  )
END
```

---

### `app/routes/public.tsx` (MODIFY)

**Objective:** Pasar los campos de tema del biolink al componente. Cambio mínimo.

**Pseudocode:**

```pseudocode
// En el loader, ya se retorna biolink completo
// Solo necesitamos asegurar que el tipo incluye los campos de tema

LOADER
  // ... existing code ...
  RETURN {
    biolink: result.biolink,  // Ya incluye theme, customPrimaryColor, customBgColor
    user: result.user,
    links,
    isPreview
  }
END

// El componente ya pasa biolink completo a PublicProfile
COMPONENT PublicPage
  RENDER <PublicProfile 
    user={data.user}
    biolink={data.biolink}    // Ahora incluye theme fields
    links={data.links}
    isPreview={data.isPreview}
  />
END
```

---

## 4. I18N

### Existing keys to reuse

- `public_no_links` - Para cuando no hay links

### New keys to create

| Key | English | Spanish |
|-----|---------|---------|
| `theme_brutalist` | Brutalist | Brutalista |
| `theme_light_minimal` | Light Minimal | Minimalista Claro |
| `theme_dark_mode` | Dark Mode | Modo Oscuro |
| `theme_colorful` | Colorful | Colorido |

> **Nota:** Estos keys se usarán en Task 4.2 (Theme Selector en dashboard). No se necesitan en la página pública.

---

## 5. E2E Test Plan

### Test: Public page renders with default theme (light_minimal)

- **Preconditions:** User has biolink with `theme: 'light_minimal'` (default)
- **Steps:**
  1. Navigate to `/:username`
  2. Inspect page background color
- **Expected:** Background is `#FAFAFA`, cards have subtle shadows, rounded corners

### Test: Public page renders with brutalist theme

- **Preconditions:** User has biolink with `theme: 'brutalist'`
- **Steps:**
  1. Navigate to `/:username`
  2. Inspect visual elements
- **Expected:** 
  - Background is cream (`#FFFDF8`)
  - Cards have 3px black borders
  - Hard offset shadows visible
  - Bold typography

### Test: Public page renders with dark_mode theme

- **Preconditions:** User has biolink with `theme: 'dark_mode'`
- **Steps:**
  1. Navigate to `/:username`
- **Expected:**
  - Background is near-black (`#0F0F0F`)
  - Text is light colored
  - Cyan accent color visible
  - Monospace font used

### Test: Public page renders with colorful theme

- **Preconditions:** User has biolink with `theme: 'colorful'`
- **Steps:**
  1. Navigate to `/:username`
- **Expected:**
  - Background is soft pink (`#FDF4FF`)
  - Cards have pill-shaped borders (rounded-full)
  - Purple text colors

### Test: Custom colors override theme defaults

- **Preconditions:** User has biolink with:
  - `theme: 'brutalist'`
  - `customPrimaryColor: '#FF0000'`
  - `customBgColor: '#00FF00'`
- **Steps:**
  1. Navigate to `/:username`
- **Expected:**
  - Background is green (`#00FF00`)
  - Primary elements use red (`#FF0000`)
  - Other brutalist styles remain (borders, shadows, typography)

### Test: Theme styles do not leak to dashboard

- **Preconditions:** User is logged in with brutalist theme on their biolink
- **Steps:**
  1. Navigate to `/dashboard`
  2. Inspect dashboard styles
- **Expected:**
  - Dashboard uses standard app styles (not brutalist)
  - No CSS variables from theme system present in dashboard

### Test: Watermark adapts to theme

- **Preconditions:** Free user with `theme: 'dark_mode'`
- **Steps:**
  1. Navigate to `/:username`
  2. Check watermark visibility
- **Expected:** Watermark text is visible (light color on dark background)

---

## 6. Implementation Notes

### Aislamiento de Estilos

El sistema usa **CSS variables inline** en el wrapper de `PublicProfile`. Esto garantiza:

1. Las variables solo existen dentro del árbol de la página pública
2. No hay clases globales que puedan contaminar otros componentes
3. Los estilos del dashboard/landing usan las variables de `app.css` sin conflicto

### Extensibilidad

Para añadir un nuevo tema en el futuro:

1. Añadir el ID al enum en `app/db/schema/biolinks.ts`
2. Definir el tema en `THEMES` de `app/lib/themes.ts`
3. Generar migración para el nuevo valor del enum

### Performance

- No hay CSS adicional cargado por tema (todo es inline o Tailwind)
- Los temas son constantes estáticas (tree-shakeable)
- Sin JavaScript runtime para cambiar temas (SSR completo)
