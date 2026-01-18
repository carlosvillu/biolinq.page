# FEATURE_0.0.1_Neo_Brutal_UI_Migration.md

## ✅ IMPLEMENTATION STATUS

**Feature completada el 2026-01-18**

### TODO List (All Done ✅)

- [x] **Instalar dependencias** - Base UI (`@base-ui/react`) y Radix Slot instalados
- [x] **Configurar colores Neo-Brutal** - Variables CSS y utilidades añadidas a `app.css`
- [x] **Crear componentes Neo-Brutal base:**
  - [x] `NeoBrutalButton` - Con variantes primary/secondary/accent y soporte asChild
  - [x] `NeoBrutalInput` - Con forwardRef para react-hook-form
  - [x] `NeoBrutalCard` - Con variantes panel/white
  - [x] `NeoBrutalMenu` - Wrapper de Base UI Menu con RadioGroup
  - [x] `NeoBrutalToast` - Sistema de toast con Base UI
  - [x] Barrel export en `app/components/neo-brutal/index.ts`
- [x] **Añadir keys i18n** - Nuevas traducciones en `en.json` y `es.json`
- [x] **Crear componentes landing:**
  - [x] `Sparkle` - Elemento decorativo SVG
  - [x] `BioLinqHero` - Hero section con value props
  - [x] `ValuePropCard` - Componente separado para cards
- [x] **Migrar componentes header:**
  - [x] `Header` - Logo BioLinq + controles
  - [x] `ThemeToggle` - Base UI Menu
  - [x] `LanguageSelector` - Base UI Menu con RadioGroup
  - [x] `UserDropdown` - Base UI Menu
- [x] **Migrar componentes landing:**
  - [x] `Footer` - Diseño minimalista Neo-Brutal
  - [x] `GoogleAuthButton` - NeoBrutalButton con icono
- [x] **Migrar rutas:**
  - [x] `home.tsx` - Usa BioLinqHero
  - [x] `auth.login.tsx` - Estilos Neo-Brutal, mantiene react-hook-form
  - [x] `auth.signup.tsx` - Estilos Neo-Brutal, mantiene react-hook-form
  - [x] `dashboard.tsx` - Placeholder creado
- [x] **Actualizar configuración:**
  - [x] `routes.ts` - Ruta /dashboard añadida
  - [x] `root.tsx` - JetBrains Mono + NeoBrutalToastProvider + Footer global
  - [x] `app/components/landing/index.ts` - Exports actualizados
- [x] **Verificación:**
  - [x] TypeCheck ✅ PASS
  - [x] ESLint ✅ PASS
  - [x] Build ✅ SUCCESS

### Pendiente

- [ ] **E2E Tests** - Ejecutar y ajustar si es necesario
- [ ] **Cleanup** - Eliminar componentes shadcn/ui no usados (después de confirmar tests)

### Notas de Implementación

**Cambios arquitectónicos:**

- Componentes Neo-Brutal organizados con un componente por archivo (ESLint `react/no-multi-comp`)
- Base UI usado para componentes interactivos (Menu, Toast)
- shadcn/ui Form mantenido para react-hook-form integration
- Toda la lógica de negocio mantenida sin cambios

**Archivos creados:**

- `app/components/neo-brutal/` (7 archivos)
- `app/components/landing/ValuePropCard.tsx`
- `app/routes/dashboard.tsx`

**Archivos modificados:**

- Todos los componentes de header/footer/landing
- Rutas de auth y home
- `app.css`, `root.tsx`, `routes.ts`
- Archivos i18n

---

## 1. Natural Language Description

### Estado Actual

La aplicación tiene un look and feel genérico proveniente del template SaaS:

- **shadcn/ui components** usados actualmente:
  - `Button` (en Header, Login, Signup, GoogleAuthButton, ThemeToggle, LanguageSelector, HeroSection)
  - `Input` (en Login, Signup)
  - `Card`, `CardContent`, `CardHeader`, `CardTitle` (en Login, Signup)
  - `Form`, `FormControl`, `FormField`, `FormItem`, `FormLabel`, `FormMessage` (en Login, Signup)
  - `DropdownMenu` y sus subcomponentes (en ThemeToggle, LanguageSelector, UserDropdown)
  - `Sonner/Toaster` (en root.tsx para toasts globales)
  - `Label` (usado internamente por Form)
  - `AlertDialog` (instalado pero sin uso actual)
  - `Checkbox`, `Textarea`, `Dialog` (instalados pero sin uso actual)
- Estilos neutros (grises, sin personalidad de marca)
- Sistema de colores basado en variables shadcn/ui estándar

### Estado Esperado

Toda la UI visible será migrada al sistema de diseño **Soft Neo-Brutalism** usando **Base UI** (`@base-ui/react`) como foundation:

1. **Migración de shadcn/ui → Base UI + Neo-Brutal styling:**
   - `Button` → Nuevo `NeoBrutalButton` (componente custom con sombra sólida)
   - `Input` → Nuevo `NeoBrutalInput` (wrapper de `<input>` nativo con estilos Neo-Brutal)
   - `Card` → Nuevo `NeoBrutalCard` (componente custom con sombra offset)
   - `DropdownMenu` → Base UI `Menu` con estilos Neo-Brutal
   - `Sonner` → Base UI `Toast` con estilos Neo-Brutal
   - `Form` → **Mantener react-hook-form** pero con componentes visuales Neo-Brutal

2. **Colores de marca:** Primary Orange (#ffc480), Accent Red (#FE4A60), Ink Black (#111827), Canvas Cream (#FFFDF8), Panel Yellow (#fff4da), Input Blue (#E8F0FE)

3. **Características visuales:**
   - Bordes gruesos (3px) en color negro
   - Sombras sólidas (hard shadows) sin blur
   - Tipografía distintiva (Inter para cuerpo, JetBrains Mono para código)
   - Animaciones de hover/press características del estilo

**Funcionalidad:** Todo seguirá funcionando exactamente igual. Es una migración puramente visual.

**Layout compartido:**

- Header Neo-Brutal: Logo BioLinq + ThemeToggle + LanguageSelector + Login/UserDropdown
- Footer Neo-Brutal: Términos, Privacidad + Copyright
- Header y Footer se muestran en: Landing, Login, Signup, Dashboard (placeholder)
- La página pública del usuario (`/:username`, Phase 4) NO tendrá header ni footer

---

## 2. Technical Description

### Enfoque

1. **Instalar Base UI:** `npm install @base-ui/react`
2. **Configurar sistema de colores Neo-Brutal en Tailwind CSS v4** (archivo `app/app.css`)
3. **Crear componentes Neo-Brutal** usando Base UI como foundation:
   - `NeoBrutalButton` - Botón con sombra sólida y efecto press
   - `NeoBrutalInput` - Input con sombra sólida
   - `NeoBrutalCard` - Card con sombra sólida
   - `NeoBrutalMenu` - Wrapper de Base UI Menu con estilos Neo-Brutal
   - `NeoBrutalToast` - Wrapper de Base UI Toast con estilos Neo-Brutal
4. **Migrar Header** al nuevo diseño (logo BioLinq + theme/language + login)
5. **Migrar Footer** al nuevo diseño (mínimo: 2 links + copyright)
6. **Migrar Landing** al diseño del mockup (`mockups/mockup.html` - view "landing")
7. **Migrar Login/Signup** al estilo Neo-Brutal (mantener react-hook-form)
8. **Crear placeholder Dashboard** con el nuevo layout
9. **Eliminar componentes shadcn/ui** que ya no se usen

### Decisiones Arquitectónicas

- Los colores Neo-Brutal se definen como variables CSS custom y clases Tailwind
- Los componentes Neo-Brutal son **nuevos componentes** que wrappean Base UI primitives
- El Header y Footer son componentes compartidos que se renderizan en `root.tsx`
- Las rutas de autenticación (`/auth/*`) mantienen el Header
- **react-hook-form + zod se mantienen** para validación de formularios
- Base UI proporciona: accesibilidad, comportamiento, composabilidad
- Nosotros proporcionamos: estilos Neo-Brutal

### Dependencias

- **Nueva:** `@base-ui/react`
- Fuentes: Inter (ya incluida), JetBrains Mono (añadir)

### Componentes Base UI a usar

| shadcn/ui actual | Base UI replacement | Uso en BioLinq                              |
| ---------------- | ------------------- | ------------------------------------------- |
| `DropdownMenu`   | `Menu`              | ThemeToggle, LanguageSelector, UserDropdown |
| `Sonner`         | `Toast`             | Notificaciones globales                     |
| `AlertDialog`    | `AlertDialog`       | Confirmaciones (futuro)                     |
| `Dialog`         | `Dialog`            | Modales (futuro)                            |

### Componentes custom (sin Base UI)

| Componente        | Razón                                                      |
| ----------------- | ---------------------------------------------------------- |
| `NeoBrutalButton` | Botón es elemento nativo `<button>`, no necesita primitivo |
| `NeoBrutalInput`  | Input es elemento nativo `<input>`, no necesita primitivo  |
| `NeoBrutalCard`   | Card es solo `<div>` con estilos                           |

---

## 2.1. Architecture Gate

- **Pages are puzzles:** Las rutas (`home.tsx`, `auth.login.tsx`, `auth.signup.tsx`, `dashboard.tsx`) solo componen componentes existentes. No contienen UI inline significativa.
- **Loaders/actions are thin:** Los loaders solo obtienen datos de sesión/usuario. No hay lógica de negocio nueva en esta tarea.
- **Business logic is not in components:** Esta tarea es puramente UI. No hay lógica de negocio involucrada.

### Detalle por ruta:

- `home.tsx`: Compone `<BioLinqHero />` + layout
- `auth.login.tsx`: Compone `<LoginForm />` (existente, con estilos actualizados)
- `auth.signup.tsx`: Compone `<SignupForm />` (existente, con estilos actualizados)
- `dashboard.tsx` (nuevo): Compone placeholder con mensaje "Coming soon"

### Componentes creados/modificados:

- `Header.tsx`: Usa hooks existentes (`useSession`). Renderiza logo + theme/language + login.
- `Footer.tsx`: Puro componente de presentación. Sin hooks de negocio.
- `NeoBrutalButton.tsx`, `NeoBrutalInput.tsx`, `NeoBrutalCard.tsx`: Componentes de presentación puros.
- `NeoBrutalMenu.tsx`: Wrapper de Base UI Menu. Solo estilos.
- `NeoBrutalToast.tsx`: Wrapper de Base UI Toast. Solo estilos + Provider.
- `BioLinqHero.tsx`: Componente de presentación con input y CTA.

---

## 3. Files to Change/Create

### `package.json`

**Objective:** Añadir dependencia de Base UI

**Pseudocode:**

```pseudocode
ADD dependency:
  "@base-ui/react": "^1.0.0"
```

---

### `app/app.css`

**Objective:** Añadir variables CSS para colores Neo-Brutal y utilidades custom

**Pseudocode:**

```pseudocode
@theme {
  // Mantener fuentes existentes
  --font-sans: Inter, system-ui, sans-serif
  --font-mono: 'JetBrains Mono', monospace

  // Añadir colores Neo-Brutal
  --color-neo-primary: #ffc480
  --color-neo-accent: #FE4A60
  --color-neo-dark: #111827
  --color-neo-canvas: #FFFDF8
  --color-neo-panel: #fff4da
  --color-neo-input: #E8F0FE
  --color-neo-control: #EBDBB7

  // Shadows
  --shadow-hard: 2px 2px 0 0 rgba(0,0,0,1)
  --shadow-hard-lg: 4px 4px 0 0 rgba(0,0,0,1)
}

// Añadir animaciones Neo-Brutal
@keyframes slide-up { from: opacity 0, translateY 30px; to: opacity 1, translateY 0 }
@keyframes float { 0%,100%: translateY 0; 50%: translateY -20px }

// Clases utilitarias
.neo-border { border: 3px solid #111827 }
.shadow-hard { box-shadow: var(--shadow-hard) }
.shadow-hard-lg { box-shadow: var(--shadow-hard-lg) }
.bg-canvas { background: #FFFDF8 }
.bg-panel { background: #fff4da }
```

---

### `app/components/neo-brutal/NeoBrutalButton.tsx`

**Objective:** Botón reutilizable con estilo Neo-Brutal (sombra sólida + efecto press)

**Pseudocode:**

```pseudocode
COMPONENT NeoBrutalButton
  PROPS:
    children: ReactNode
    variant: 'primary' | 'secondary' | 'accent' (default: primary)
    size: 'sm' | 'md' | 'lg' (default: md)
    className?: string
    asChild?: boolean (for composition with Link, etc.)
    ...buttonProps (onClick, disabled, type, etc.)

  USE Slot from @radix-ui/react-slot for asChild support

  RENDER:
    <div className="relative group cursor-pointer">
      // Shadow layer
      <div className="absolute inset-0 bg-neo-dark rounded translate-x-1 translate-y-1
        transition-transform group-hover:translate-x-2 group-hover:translate-y-2" />
      // Button face (or Slot if asChild)
      <Comp className={cn(
        "relative z-10 px-6 py-3 font-bold border-[3px] border-neo-dark rounded",
        "transition-transform duration-200 ease-out",
        "group-hover:-translate-y-px group-hover:-translate-x-px",
        "active:translate-x-[2px] active:translate-y-[2px]",
        variant === 'primary' && "bg-neo-primary text-neo-dark",
        variant === 'secondary' && "bg-white text-neo-dark",
        variant === 'accent' && "bg-neo-accent text-white",
        size === 'sm' && "px-4 py-2 text-sm",
        size === 'md' && "px-6 py-3 text-base",
        size === 'lg' && "px-8 py-4 text-lg",
        className
      )} {...buttonProps}>
        {children}
      </Comp>
    </div>
END
```

---

### `app/components/neo-brutal/NeoBrutalInput.tsx`

**Objective:** Input reutilizable con estilo Neo-Brutal

**Pseudocode:**

```pseudocode
COMPONENT NeoBrutalInput
  PROPS:
    className?: string
    ...inputProps (type, placeholder, value, onChange, name, etc.)

  USE forwardRef for react-hook-form compatibility

  RENDER:
    <div className="relative">
      // Shadow layer
      <div className="absolute inset-0 bg-neo-dark rounded translate-x-1 translate-y-1" />
      // Input field
      <input
        ref={ref}
        className={cn(
          "relative z-10 w-full px-4 py-3",
          "bg-neo-input border-[3px] border-neo-dark rounded",
          "font-medium focus:outline-none focus:ring-2 focus:ring-neo-primary",
          "placeholder-gray-500",
          className
        )}
        {...inputProps}
      />
    </div>
END
```

---

### `app/components/neo-brutal/NeoBrutalCard.tsx`

**Objective:** Card reutilizable con estilo Neo-Brutal

**Pseudocode:**

```pseudocode
COMPONENT NeoBrutalCard
  PROPS:
    children: ReactNode
    variant: 'panel' | 'white' (default: panel)
    className?: string

  RENDER:
    <div className="relative">
      // Shadow layer
      <div className="absolute inset-0 bg-neo-dark rounded-xl translate-x-2 translate-y-2" />
      // Card content
      <div className={cn(
        "relative z-10 border-[3px] border-neo-dark rounded-xl p-6 md:p-8",
        variant === 'panel' && "bg-neo-panel",
        variant === 'white' && "bg-white",
        className
      )}>
        {children}
      </div>
    </div>
END
```

---

### `app/components/neo-brutal/NeoBrutalMenu.tsx`

**Objective:** Wrapper de Base UI Menu con estilos Neo-Brutal para dropdowns

**Pseudocode:**

```pseudocode
IMPORT { Menu } from '@base-ui/react/menu'

// Re-export subcomponentes con estilos Neo-Brutal
EXPORT NeoBrutalMenuRoot = Menu.Root
EXPORT NeoBrutalMenuTrigger = Menu.Trigger // Usará NeoBrutalButton como child

COMPONENT NeoBrutalMenuPopup
  PROPS: children, className, ...props

  RENDER:
    <Menu.Portal>
      <Menu.Positioner sideOffset={8}>
        <Menu.Popup className={cn(
          "bg-white border-[3px] border-neo-dark rounded shadow-hard-lg",
          "py-2 min-w-[180px]",
          "animate-in fade-in-0 zoom-in-95",
          className
        )} {...props}>
          {children}
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
END

COMPONENT NeoBrutalMenuItem
  PROPS: children, className, ...props

  RENDER:
    <Menu.Item className={cn(
      "px-4 py-2 text-sm font-medium cursor-pointer",
      "hover:bg-neo-panel transition-colors",
      "data-[highlighted]:bg-neo-panel",
      className
    )} {...props}>
      {children}
    </Menu.Item>
END

COMPONENT NeoBrutalMenuSeparator
  RENDER:
    <Menu.Separator className="h-px bg-neo-dark my-2" />
END

// También export RadioGroup, RadioItem para LanguageSelector
EXPORT NeoBrutalMenuRadioGroup = Menu.RadioGroup
COMPONENT NeoBrutalMenuRadioItem
  PROPS: value, children, className, ...props

  RENDER:
    <Menu.RadioItem value={value} className={cn(
      "px-4 py-2 text-sm font-medium cursor-pointer flex items-center gap-2",
      "hover:bg-neo-panel transition-colors",
      "data-[highlighted]:bg-neo-panel",
      className
    )} {...props}>
      <Menu.RadioItemIndicator className="w-4 h-4 flex items-center justify-center">
        <span className="w-2 h-2 rounded-full bg-neo-dark" />
      </Menu.RadioItemIndicator>
      {children}
    </Menu.RadioItem>
END
```

---

### `app/components/neo-brutal/NeoBrutalToast.tsx`

**Objective:** Sistema de Toast con Base UI y estilos Neo-Brutal

**Pseudocode:**

```pseudocode
IMPORT { Toast } from '@base-ui/react/toast'
IMPORT { createContext, useContext } from 'react'

// Context para acceso global al toast
CREATE ToastContext with add() method

COMPONENT NeoBrutalToastProvider
  PROPS: children

  USE Toast.Provider internally
  PROVIDE context with add function

  RENDER:
    <Toast.Provider>
      {children}
      <Toast.Portal>
        <Toast.Viewport className="fixed bottom-4 right-4 flex flex-col gap-2 z-50 max-w-sm">
          // Toasts se renderizan aquí automáticamente
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
END

COMPONENT NeoBrutalToastRoot
  PROPS: children, variant: 'default' | 'success' | 'error'

  RENDER:
    <Toast.Root className="relative">
      <div className="absolute inset-0 bg-neo-dark rounded translate-x-1 translate-y-1" />
      <Toast.Content className={cn(
        "relative z-10 border-[3px] border-neo-dark rounded p-4",
        variant === 'default' && "bg-white",
        variant === 'success' && "bg-neo-primary",
        variant === 'error' && "bg-neo-accent text-white"
      )}>
        {children}
      </Toast.Content>
    </Toast.Root>
END

// Hook para usar toast
EXPORT useToast() {
  return useContext(ToastContext)
}
```

---

### `app/components/neo-brutal/index.ts`

**Objective:** Barrel export para componentes Neo-Brutal

**Pseudocode:**

```pseudocode
EXPORT * from './NeoBrutalButton'
EXPORT * from './NeoBrutalInput'
EXPORT * from './NeoBrutalCard'
EXPORT * from './NeoBrutalMenu'
EXPORT * from './NeoBrutalToast'
```

---

### `app/components/Header.tsx`

**Objective:** Migrar al diseño Neo-Brutal. Logo BioLinq + ThemeToggle + LanguageSelector + Login/UserDropdown

**Pseudocode:**

```pseudocode
COMPONENT Header
  PROPS: session, user (como actualmente)

  RENDER:
    <header className="sticky top-0 bg-neo-canvas border-b-[3px] border-neo-dark z-40">
      <div className="max-w-4xl mx-auto px-4 h-16 flex justify-between items-center">
        // Logo
        <Link to="/" className="flex items-center gap-1">
          <span className="text-2xl font-black tracking-tighter">Bio</span>
          <span className="text-2xl font-black text-neo-accent tracking-tighter">Linq</span>
          <span className="text-xs font-mono bg-neo-control px-1 border border-neo-dark ml-2">BETA</span>
        </Link>

        // Right section
        <div className="flex items-center gap-2">
          <ThemeToggle />  // Migrado a usar NeoBrutalMenu
          <LanguageSelector />  // Migrado a usar NeoBrutalMenu

          IF user THEN
            <UserDropdown user={user} />  // Migrado a usar NeoBrutalMenu
          ELSE
            <Link to="/auth/login">
              <NeoBrutalButton variant="secondary" size="sm">
                {t('login')}
              </NeoBrutalButton>
            </Link>
          END IF
        </div>
      </div>
    </header>
END
```

---

### `app/components/ThemeToggle.tsx`

**Objective:** Migrar de shadcn/ui DropdownMenu a Base UI Menu con estilos Neo-Brutal

**Pseudocode:**

```pseudocode
IMPORT { NeoBrutalMenuRoot, NeoBrutalMenuTrigger, NeoBrutalMenuPopup, NeoBrutalMenuItem }

COMPONENT ThemeToggle
  USE existing useTheme hook

  RENDER:
    <NeoBrutalMenuRoot>
      <NeoBrutalMenuTrigger>
        <button className="p-2 border-[3px] border-neo-dark rounded bg-white hover:bg-neo-panel">
          <SunIcon /> or <MoonIcon />
        </button>
      </NeoBrutalMenuTrigger>
      <NeoBrutalMenuPopup>
        <NeoBrutalMenuItem onClick={() => setTheme("light")}>
          <SunIcon /> Light
        </NeoBrutalMenuItem>
        <NeoBrutalMenuItem onClick={() => setTheme("dark")}>
          <MoonIcon /> Dark
        </NeoBrutalMenuItem>
        <NeoBrutalMenuItem onClick={() => setTheme("system")}>
          <LaptopIcon /> System
        </NeoBrutalMenuItem>
      </NeoBrutalMenuPopup>
    </NeoBrutalMenuRoot>
END
```

---

### `app/components/LanguageSelector.tsx`

**Objective:** Migrar de shadcn/ui DropdownMenu a Base UI Menu con RadioGroup

**Pseudocode:**

```pseudocode
IMPORT { NeoBrutalMenuRoot, NeoBrutalMenuTrigger, NeoBrutalMenuPopup, NeoBrutalMenuRadioGroup, NeoBrutalMenuRadioItem }

COMPONENT LanguageSelector
  USE existing i18n hooks

  RENDER:
    <NeoBrutalMenuRoot>
      <NeoBrutalMenuTrigger>
        <button className="p-2 border-[3px] border-neo-dark rounded bg-white hover:bg-neo-panel">
          <GlobeIcon />
        </button>
      </NeoBrutalMenuTrigger>
      <NeoBrutalMenuPopup>
        <NeoBrutalMenuRadioGroup value={currentLanguage} onValueChange={changeLanguage}>
          <NeoBrutalMenuRadioItem value="en">English</NeoBrutalMenuRadioItem>
          <NeoBrutalMenuRadioItem value="es">Español</NeoBrutalMenuRadioItem>
        </NeoBrutalMenuRadioGroup>
      </NeoBrutalMenuPopup>
    </NeoBrutalMenuRoot>
END
```

---

### `app/components/UserDropdown.tsx`

**Objective:** Migrar de shadcn/ui DropdownMenu a Base UI Menu

**Pseudocode:**

```pseudocode
IMPORT { NeoBrutalMenuRoot, NeoBrutalMenuTrigger, NeoBrutalMenuPopup, NeoBrutalMenuItem, NeoBrutalMenuSeparator }

COMPONENT UserDropdown
  PROPS: user

  RENDER:
    <NeoBrutalMenuRoot>
      <NeoBrutalMenuTrigger>
        <button className="flex items-center gap-2 px-3 py-2 border-[3px] border-neo-dark rounded bg-white hover:bg-neo-panel">
          <Avatar /> {user.name}
        </button>
      </NeoBrutalMenuTrigger>
      <NeoBrutalMenuPopup>
        <NeoBrutalMenuItem asChild>
          <Link to="/dashboard">Dashboard</Link>
        </NeoBrutalMenuItem>
        <NeoBrutalMenuItem asChild>
          <Link to="/settings">Settings</Link>
        </NeoBrutalMenuItem>
        <NeoBrutalMenuSeparator />
        <NeoBrutalMenuItem onClick={logout}>
          Sign out
        </NeoBrutalMenuItem>
      </NeoBrutalMenuPopup>
    </NeoBrutalMenuRoot>
END
```

---

### `app/components/landing/Footer.tsx`

**Objective:** Migrar al diseño Neo-Brutal mínimo (2 links + copyright)

**Pseudocode:**

```pseudocode
COMPONENT Footer
  RENDER:
    <footer className="border-t-[3px] border-neo-dark bg-neo-canvas py-8">
      <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        // Links
        <div className="flex gap-6 text-sm font-medium">
          <Link to="/terms" className="hover:underline">{t('footer_terms')}</Link>
          <Link to="/privacy" className="hover:underline">{t('footer_privacy')}</Link>
        </div>

        // Copyright
        <p className="font-mono text-sm text-gray-600">
          © 2026 BioLinq. {t('footer_rights')}
        </p>
      </div>
    </footer>
END
```

---

### `app/components/landing/BioLinqHero.tsx`

**Objective:** Hero section específica de BioLinq basada en el mockup

**Pseudocode:**

```pseudocode
COMPONENT BioLinqHero
  RENDER:
    <main className="max-w-4xl mx-auto px-4 py-16 md:py-24">
      // Hero Section
      <div className="text-center mb-16 relative">
        // Decorative sparkles (SVG)
        <Sparkle position="top-left" color="accent" />
        <Sparkle position="bottom-right" color="primary" />

        // Title
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.9] mb-6">
          Less is more.<br />
          <span className="text-gray-500 text-3xl md:text-5xl font-bold tracking-tight block mt-2">
            {t('hero_tagline')}
          </span>
        </h1>

        // Subtitle
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          {t('hero_description')}
          <span className="bg-neo-control px-1 border border-neo-dark text-sm font-mono font-bold">
            &lt;500ms
          </span>
        </p>

        // Action Box (NeoBrutalCard)
        <div className="max-w-md mx-auto">
          <NeoBrutalCard>
            <div className="flex flex-col gap-4">
              <NeoBrutalInput placeholder="biolinq.page/usuario" className="text-center" />
              <Link to="/auth/login">
                <NeoBrutalButton variant="accent" className="w-full gap-3">
                  <GoogleIcon />
                  {t('hero_cta')}
                </NeoBrutalButton>
              </Link>
              <p className="text-xs text-gray-500 font-mono">
                {t('hero_pricing_note')}
              </p>
            </div>
          </NeoBrutalCard>
        </div>
      </div>

      // Value Props
      <div className="grid md:grid-cols-3 gap-6 mt-20">
        <ValuePropCard icon="⚡" title={t('value_speed_title')} description={t('value_speed_desc')} />
        <ValuePropCard icon="🎨" title={t('value_design_title')} description={t('value_design_desc')} />
        <ValuePropCard icon="💸" title={t('value_price_title')} description={t('value_price_desc')} badge="BEST VALUE" />
      </div>
    </main>
END

COMPONENT ValuePropCard
  PROPS: icon, title, description, badge?
  RENDER:
    <div className="border-[3px] border-neo-dark bg-white p-6 rounded shadow-hard relative">
      IF badge THEN
        <span className="badge-new absolute -top-3 -right-2">{badge}</span>
      END IF
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
END
```

---

### `app/components/landing/Sparkle.tsx`

**Objective:** Elemento decorativo SVG para el hero

**Pseudocode:**

```pseudocode
COMPONENT Sparkle
  PROPS: position: 'top-left' | 'bottom-right', color: 'accent' | 'primary'

  positionClasses = {
    'top-left': 'absolute top-0 left-10 md:left-32 -translate-y-full',
    'bottom-right': 'absolute bottom-0 right-10 md:right-32 translate-y-full'
  }

  colorClasses = {
    'accent': 'text-neo-accent',
    'primary': 'text-neo-primary'
  }

  RENDER:
    <svg className={cn(positionClasses[position], colorClasses[color], "w-8 h-8 md:w-12 md:h-12 animate-pulse")}
         fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
END
```

---

### `app/components/landing/index.ts`

**Objective:** Actualizar exports

**Pseudocode:**

```pseudocode
EXPORT BioLinqHero from './BioLinqHero'
EXPORT Footer from './Footer'
EXPORT Sparkle from './Sparkle'
// Remover HeroSection y EditorialDivider (ya no se usan)
```

---

### `app/routes/home.tsx`

**Objective:** Usar nuevos componentes de landing

**Pseudocode:**

```pseudocode
LOADER:
  user = await getCurrentUser(request)
  RETURN { user }

COMPONENT HomePage
  data = useLoaderData()

  RENDER:
    <div className="min-h-screen bg-neo-canvas flex flex-col">
      <BioLinqHero />
    </div>
END
```

---

### `app/routes/auth.login.tsx`

**Objective:** Aplicar estilos Neo-Brutal al formulario de login (manteniendo react-hook-form)

**Pseudocode:**

```pseudocode
LOADER: (sin cambios - maneja OAuth errors)

ACTION: (sin cambios - maneja form submission)

COMPONENT LoginPage
  // Mantener lógica existente de useActionData, fetcher, form validation con react-hook-form

  RENDER:
    <div className="min-h-screen bg-neo-canvas flex items-center justify-center px-4">
      <NeoBrutalCard className="w-full max-w-md">
        <h1 className="text-2xl font-bold tracking-tight mb-6 text-center">
          {t('login_title')}
        </h1>

        // Google OAuth Button (con estilos Neo-Brutal)
        <NeoBrutalButton variant="accent" className="w-full mb-4 gap-3" onClick={googleAuth}>
          <GoogleIcon />
          {t('google_continue')}
        </NeoBrutalButton>

        // Divider
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t-2 border-neo-dark" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-neo-panel px-2 text-sm font-mono">{t('or_divider')}</span>
          </div>
        </div>

        // Form (mantener react-hook-form, cambiar componentes visuales)
        <Form {...form}>
          <form onSubmit={...} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('email_label')}</FormLabel>
                  <FormControl>
                    <NeoBrutalInput type="email" placeholder={t('email_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('password_label')}</FormLabel>
                  <FormControl>
                    <NeoBrutalInput type="password" placeholder={t('password_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <NeoBrutalButton type="submit" variant="primary" className="w-full">
              {t('login')}
            </NeoBrutalButton>
          </form>
        </Form>

        // Link to signup
        <p className="text-center text-sm mt-6">
          {t('no_account_prompt')}
          <Link to="/auth/signup" className="font-bold underline ml-1">{t('signup_link')}</Link>
        </p>
      </NeoBrutalCard>
    </div>
END
```

---

### `app/routes/auth.signup.tsx`

**Objective:** Aplicar estilos Neo-Brutal al formulario de signup (similar a login)

**Pseudocode:**

```pseudocode
// Mismo patrón que login.tsx pero con campos adicionales (name, confirm password)
// Mantener react-hook-form, cambiar componentes visuales a Neo-Brutal
```

---

### `app/routes/dashboard.tsx` (NUEVO)

**Objective:** Crear placeholder para dashboard con layout Neo-Brutal

**Pseudocode:**

```pseudocode
LOADER:
  user = await getCurrentUser(request)
  IF NOT user THEN redirect('/auth/login')
  RETURN { user }

COMPONENT DashboardPage
  data = useLoaderData()

  RENDER:
    <div className="min-h-screen bg-neo-input/30">
      <main className="max-w-4xl mx-auto px-4 py-16">
        <NeoBrutalCard>
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
            <p className="text-gray-600 font-mono">Coming soon in Phase 2...</p>
            <p className="text-sm text-gray-500 mt-4">
              Logged in as: {data.user.email}
            </p>
          </div>
        </NeoBrutalCard>
      </main>
    </div>
END
```

---

### `app/routes.ts`

**Objective:** Añadir ruta /dashboard

**Pseudocode:**

```pseudocode
// Añadir a la lista de rutas existentes:
route("/dashboard", "routes/dashboard.tsx")
```

---

### `app/root.tsx`

**Objective:** Reemplazar Sonner por NeoBrutalToastProvider. Añadir fuente JetBrains Mono. Renderizar Footer globalmente.

**Pseudocode:**

```pseudocode
// En links():
AÑADIR link para JetBrains Mono de Google Fonts

// En App():
REEMPLAZAR <Toaster /> de Sonner por <NeoBrutalToastProvider>

COMPONENT App
  RENDER:
    <NeoBrutalToastProvider>
      <ThemeProvider>
        <I18nextProvider>
          <div className="min-h-screen flex flex-col bg-neo-canvas">
            <Header session={session} user={user} />
            <main className="flex-1">
              <Outlet />
            </main>
            <Footer />
          </div>
        </I18nextProvider>
      </ThemeProvider>
    </NeoBrutalToastProvider>
END
```

---

### Archivos a ELIMINAR (shadcn/ui que ya no se usarán)

**Pseudocode:**

```pseudocode
DELETE app/components/ui/button.tsx  // Reemplazado por NeoBrutalButton
DELETE app/components/ui/input.tsx  // Reemplazado por NeoBrutalInput
DELETE app/components/ui/card.tsx  // Reemplazado por NeoBrutalCard
DELETE app/components/ui/dropdown-menu.tsx  // Reemplazado por NeoBrutalMenu (Base UI)
DELETE app/components/ui/sonner.tsx  // Reemplazado por NeoBrutalToast (Base UI)
DELETE app/components/ui/label.tsx  // No se usa directamente
DELETE app/components/ui/alert-dialog.tsx  // No se usa actualmente, usar Base UI si se necesita
DELETE app/components/ui/checkbox.tsx  // No se usa actualmente, usar Base UI si se necesita
DELETE app/components/ui/dialog.tsx  // No se usa actualmente, usar Base UI si se necesita
DELETE app/components/ui/textarea.tsx  // No se usa actualmente, crear Neo-Brutal si se necesita

KEEP app/components/ui/form.tsx  // Se mantiene para react-hook-form integration

DELETE app/components/landing/HeroSection.tsx  // Reemplazado por BioLinqHero
DELETE app/components/landing/EditorialDivider.tsx  // No se usa en el nuevo diseño
```

---

## 4. I18N

### Existing keys to reuse

- `login` - Para botón login en header
- `login_title` - Título página login
- `signup_title` - Título página signup
- `google_continue` - Botón Google OAuth
- `or_divider` - Separador "o"
- `no_account_prompt` - Link a signup
- `have_account_prompt` - Link a login
- `email_placeholder`, `password_placeholder` - Placeholders

### New keys to create

| Key                  | English                                                    | Spanish                                                |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| `hero_tagline`       | Stand out by being simple.                                 | Diferénciate siendo simple.                            |
| `hero_description`   | The minimalist Linktree. Your page loads in                | El Linktree minimalista. Tu página carga en            |
| `hero_cta`           | Create my BioLink                                          | Crear mi BioLink                                       |
| `hero_pricing_note`  | Freemium • 5€ Lifetime Premium                             | Freemium • 5€ Premium de por vida                      |
| `value_speed_title`  | Ultra Fast                                                 | Ultra Rápido                                           |
| `value_speed_desc`   | No heavy scripts. Your followers won't wait.               | Sin scripts pesados. Tus seguidores no esperarán.      |
| `value_design_title` | Brutalist Design                                           | Diseño Brutalista                                      |
| `value_design_desc`  | 4 professional themes that stand out for their simplicity. | 4 temas profesionales que destacan por su simplicidad. |
| `value_price_title`  | One-time Payment                                           | Pago Único                                             |
| `value_price_desc`   | Pay 5€ once. No ridiculous monthly subscriptions.          | Paga 5€ una vez. Sin suscripciones mensuales absurdas. |
| `footer_terms`       | Terms                                                      | Términos                                               |
| `footer_privacy`     | Privacy                                                    | Privacidad                                             |
| `footer_rights`      | All rights reserved.                                       | Todos los derechos reservados.                         |

---

## 5. E2E Test Plan

### Test: Landing page renders with Neo-Brutal design

- **Preconditions:** User is not logged in
- **Steps:** Navigate to `/`
- **Expected:**
  - Hero section visible with "Less is more" title
  - Value props cards visible (3 cards)
  - Header shows "BioLinq" logo and "Login" button
  - Footer shows Terms and Privacy links

### Test: Login page renders with Neo-Brutal design

- **Preconditions:** User is not logged in
- **Steps:** Navigate to `/auth/login`
- **Expected:**
  - Page has cream background
  - Card with shadow visible
  - Google OAuth button visible with Neo-Brutal styling
  - Form fields have Neo-Brutal input styling

### Test: Signup page renders with Neo-Brutal design

- **Preconditions:** User is not logged in
- **Steps:** Navigate to `/auth/signup`
- **Expected:** Similar to login page with additional fields

### Test: Dashboard placeholder renders for authenticated user

- **Preconditions:** User is logged in
- **Steps:** Navigate to `/dashboard`
- **Expected:**
  - "Coming soon" message displayed
  - User email shown
  - Header shows UserDropdown (not Login button)

### Test: Dashboard redirects to login for unauthenticated user

- **Preconditions:** User is NOT logged in
- **Steps:** Navigate to `/dashboard`
- **Expected:** Redirected to `/auth/login`

### Test: Header and Footer appear on all pages

- **Preconditions:** N/A
- **Steps:** Navigate to `/`, `/auth/login`, `/auth/signup`, `/dashboard` (authenticated)
- **Expected:** Header and Footer visible on all pages

### Test: Theme toggle works with Neo-Brutal Menu

- **Preconditions:** User is on any page
- **Steps:** Click theme toggle button, select "Dark"
- **Expected:** Theme changes, menu closes

### Test: Language selector works with Neo-Brutal Menu

- **Preconditions:** User is on any page
- **Steps:** Click language selector, select "Español"
- **Expected:** Language changes, menu closes, UI text updates

---

## 6. Files Summary

### New Files

- `app/components/neo-brutal/NeoBrutalButton.tsx`
- `app/components/neo-brutal/NeoBrutalInput.tsx`
- `app/components/neo-brutal/NeoBrutalCard.tsx`
- `app/components/neo-brutal/NeoBrutalMenu.tsx`
- `app/components/neo-brutal/NeoBrutalToast.tsx`
- `app/components/neo-brutal/index.ts`
- `app/components/landing/BioLinqHero.tsx`
- `app/components/landing/Sparkle.tsx`
- `app/routes/dashboard.tsx`

### Modified Files

- `package.json` - Añadir @base-ui/react
- `app/app.css` - Añadir colores y utilidades Neo-Brutal
- `app/root.tsx` - Añadir fuente, cambiar Toast provider, Footer global
- `app/routes.ts` - Añadir ruta /dashboard
- `app/components/Header.tsx` - Rediseñar al estilo Neo-Brutal
- `app/components/ThemeToggle.tsx` - Migrar a Base UI Menu
- `app/components/LanguageSelector.tsx` - Migrar a Base UI Menu
- `app/components/UserDropdown.tsx` - Migrar a Base UI Menu
- `app/components/landing/Footer.tsx` - Rediseñar al estilo Neo-Brutal
- `app/components/landing/index.ts` - Actualizar exports
- `app/routes/home.tsx` - Usar nuevos componentes
- `app/routes/auth.login.tsx` - Aplicar estilos Neo-Brutal (mantener react-hook-form)
- `app/routes/auth.signup.tsx` - Aplicar estilos Neo-Brutal (mantener react-hook-form)
- `app/locales/en.json` - Añadir nuevas keys
- `app/locales/es.json` - Añadir nuevas keys

### Files to Delete

- `app/components/ui/button.tsx`
- `app/components/ui/input.tsx`
- `app/components/ui/card.tsx`
- `app/components/ui/dropdown-menu.tsx`
- `app/components/ui/sonner.tsx`
- `app/components/ui/label.tsx`
- `app/components/ui/alert-dialog.tsx`
- `app/components/ui/checkbox.tsx`
- `app/components/ui/dialog.tsx`
- `app/components/ui/textarea.tsx`
- `app/components/landing/HeroSection.tsx`
- `app/components/landing/EditorialDivider.tsx`

### Files to Keep (shadcn/ui)

- `app/components/ui/form.tsx` - Necesario para react-hook-form integration
