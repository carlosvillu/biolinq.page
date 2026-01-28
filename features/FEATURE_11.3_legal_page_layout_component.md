# FEATURE_11.3 - Legal Page Layout Component

## 1. Natural Language Description

**Current State:**
El proyecto tiene infraestructura Markdown implementada (Task 11.1) y un servicio de contenido legal funcional (Task 11.2) que puede leer archivos `.md` desde `content/legal/{locale}/{page}.md`, parsearlos a HTML y extraer título y descripción. Sin embargo, no existe ningún componente de layout para renderizar este contenido HTML ni rutas públicas para acceder a las páginas legales (`/terms`, `/privacy`, `/cookies`).

**Expected End State:**
Después de esta tarea, existirá:
1. Un componente `LegalPageLayout.tsx` que acepta HTML sanitizado y lo renderiza con el diseño Neo-Brutal del proyecto
2. El componente aplicará las clases `prose` de Tailwind para tipografía legible, combinadas con el estilo Neo-Brutal (bordes de 3px, fondo bg-neo-panel, sombras sólidas)
3. El layout incluirá el Header global (logo + language selector) y Footer global (links a otras páginas legales)
4. El diseño será responsive (max-w-3xl, centrado, padding adecuado en mobile)
5. El componente será reutilizable para las 3 páginas legales (terms, privacy, cookies) sin duplicación de código

**User Experience:**
Un usuario que hace clic en "Terms" en el footer verá una página bien formateada con el contenido legal renderizado desde Markdown, con navegación clara (header/footer) y diseño consistente con el resto del sitio.

---

## 2. Technical Description

Este componente es un **presentational component** puro que recibe HTML ya sanitizado del loader y lo renderiza con estilos. No tiene lógica de negocio, no hace fetching de datos, y no maneja estado.

**Architecture Approach:**
- El componente vive en `app/components/legal/LegalPageLayout.tsx`
- Acepta props: `html` (string), `title` (string)
- Usa `dangerouslySetInnerHTML` para renderizar el HTML sanitizado (seguro porque ya fue procesado por DOMPurify en el servicio)
- Aplica clases Tailwind `prose prose-lg` para formatear el contenido Markdown renderizado
- Envuelve el contenido en un container Neo-Brutal: `bg-neo-panel border-[3px] border-neo-dark rounded-xl`
- El layout usa la estructura de página completa: Header (existente) → contenido → Footer (existente)
- El responsivo sigue el patrón mobile-first del proyecto

**Why this approach:**
- Separación de concerns: el servicio maneja parsing/sanitización, el componente solo renderiza
- Reutilización: el mismo componente sirve para terms, privacy y cookies sin cambios
- Consistencia visual: usa los mismos componentes Header/Footer que el resto del sitio
- Seguridad: confía en el HTML sanitizado del servicio (no vuelve a sanitizar)

---

## 2.1. Architecture Gate

**Pages are puzzles:**
✅ Este componente es puramente presentacional. Las rutas que lo usen (Task 11.4, 11.5, 11.6) serán "puzzles" que:
- Loader: llama a `getLegalContent(page, locale)` del servicio
- Component: renderiza `<LegalPageLayout html={data.html} title={data.title} />`
- Ninguna lógica de dominio en el route module

**Loaders/actions are thin:**
✅ Los loaders de las rutas legales (próximas tareas) solo harán:
1. Detectar locale desde i18n context
2. Llamar a `getLegalContent(page, locale)`
3. Retornar `{ html, title, description }`
- No inline parsing, no inline DB queries

**Business logic is not in components:**
✅ Este componente NO tiene lógica de negocio:
- No parsea Markdown (lo hace el servicio)
- No sanitiza HTML (lo hace el servicio)
- No hace fetching (lo hace el loader)
- Solo renderiza HTML + aplica estilos

**Domain logic:**
- `app/services/legal-content.server.ts` ya contiene toda la lógica de dominio (Task 11.2)

**UI orchestration:**
- No hay hooks necesarios, el componente es stateless

---

## 3. Files to Change/Create

### `app/components/legal/LegalPageLayout.tsx`

**Objective:**
Crear el componente de layout para páginas legales que renderiza HTML sanitizado con estilos Neo-Brutal, incluyendo Header y Footer globales, y tipografía legible con Tailwind `prose`.

**Pseudocode:**

```pseudocode
COMPONENT LegalPageLayout
  INPUT:
    - html: string (HTML sanitizado del Markdown)
    - title: string (Título extraído del H1)

  STRUCTURE:
    1. Render page container
       - Use min-h-screen to fill viewport
       - bg-neo-input/30 for subtle background (same as dashboard.account.tsx)

    2. Render main content area
       - max-w-3xl mx-auto (centered, max width for readability)
       - px-4 py-8 md:py-12 (responsive padding)

    3. Render page title
       - <h1> with text-3xl md:text-4xl font-bold text-neo-dark
       - mb-8 for spacing before content

    4. Render Neo-Brutal card container
       - Wrapper div: relative
       - Shadow layer: absolute inset-0 bg-neo-dark rounded-xl translate-x-2 translate-y-2
       - Content card: relative z-10 bg-neo-panel border-[3px] border-neo-dark rounded-xl p-6 md:p-8

    5. Render HTML content inside card
       - Use dangerouslySetInnerHTML={{ __html: html }}
       - Apply Tailwind prose classes: prose prose-lg prose-neo-dark max-w-none
       - Customize prose with Neo-Brutal overrides:
         * prose-headings:font-bold prose-headings:text-neo-dark
         * prose-a:text-neo-primary prose-a:font-medium prose-a:underline
         * prose-strong:text-neo-dark prose-strong:font-bold
         * prose-p:text-gray-700 prose-p:leading-relaxed
         * prose-li:text-gray-700

  RESPONSIVE BEHAVIOR:
    - Mobile (< 768px): single column, p-6 card padding
    - Desktop (>= 768px): max-w-3xl, p-8 card padding

  ACCESSIBILITY:
    - Semantic HTML: main, article wrapper for content
    - Proper heading hierarchy preserved from Markdown
    - Focus styles inherited from global styles

  RETURN:
    - JSX with full page layout (Header implicit via root.tsx, Footer in this component)

END COMPONENT
```

**TypeScript Interface:**

```pseudocode
INTERFACE LegalPageLayoutProps
  html: string       // Sanitized HTML from marked + DOMPurify
  title: string      // Page title (e.g., "Terms of Service")
END INTERFACE
```

**Implementation Notes:**

1. **Imports needed:**
   - No React hooks (stateless component)
   - No useTranslation (title ya viene traducido del servicio)
   - No external dependencies beyond React

2. **Neo-Brutal styling specifics:**
   - Card shadow: `translate-x-2 translate-y-2` (larger than button shadows for emphasis)
   - Border: `border-[3px]` (signature Neo-Brutal thickness)
   - Background: `bg-neo-panel` (#fff4da) for warmth on legal text
   - Rounded corners: `rounded-xl` (12px, standard for cards)

3. **Tailwind prose customization:**
   - Use `@tailwindcss/typography` plugin (already in project)
   - Prefix prose utilities with `prose-` to override default styles
   - Ensure links are visible and interactive (underline on hover)
   - Ensure headings stand out with bold weights

4. **dangerouslySetInnerHTML safety:**
   - SAFE because `html` comes from `DOMPurify.sanitize()` in `legal-content.server.ts`
   - No user-generated content, only Markdown files from `content/legal/`

5. **Example prose overrides in className:**
   ```tsx
   prose prose-lg max-w-none
   prose-headings:font-bold prose-headings:text-neo-dark prose-headings:tracking-tight
   prose-p:text-gray-700 prose-p:leading-relaxed
   prose-a:text-neo-primary prose-a:font-medium prose-a:underline
   prose-strong:font-bold prose-strong:text-neo-dark
   prose-ul:text-gray-700 prose-ol:text-gray-700
   prose-li:marker:text-neo-dark
   ```

6. **Component file location:**
   - Create new directory: `app/components/legal/`
   - This follows the pattern of `app/components/dashboard/`, `app/components/public/`, etc.

---

## 4. I18N Section

**No new i18n keys required for this component.**

**Reasoning:**
- El `title` ya viene traducido del servicio `getLegalContent()`, que lee el archivo Markdown en el locale correcto
- El contenido HTML ya está en el idioma correcto (extraído del Markdown localizado)
- El Header y Footer usan sus propias claves existentes (`footer_terms`, `footer_privacy`, etc.)

**Existing keys reused:**
- `footer_terms` - Para el link en el footer
- `footer_privacy` - Para el link en el footer
- (Task 11.6 agregará `footer_cookies` para la página de cookies)

**Note:** Si en el futuro se quisiera agregar un "Last updated" o breadcrumbs, se necesitarían nuevas claves, pero el scope actual no lo requiere.

---

## 5. E2E Test Plan

**Note:** Los tests E2E completos se implementarán en las tareas 11.4, 11.5 y 11.6 cuando se creen las rutas. Esta sección describe los tests que verificarán el componente `LegalPageLayout` integrado en una ruta real.

### Test 1: Legal page renders with Neo-Brutal styling

**Preconditions:**
- Una ruta legal existe (e.g., `/terms`)
- El servicio `getLegalContent('terms', 'en')` retorna HTML válido

**Steps:**
1. Navigate to `/terms`
2. Wait for page to load

**Expected:**
- Page title is visible (e.g., "Terms of Service")
- Content is wrapped in Neo-Brutal card with:
  - Border of 3px solid dark
  - Background `bg-neo-panel` (yellowish)
  - Solid shadow visible (translate-x-2 translate-y-2)
- Content uses Tailwind `prose` classes
- Markdown headings are rendered as `<h2>`, `<h3>`, etc.
- Links in content are underlined and clickable

**Playwright selectors:**
```typescript
await expect(page.locator('h1')).toContainText('Terms of Service')
await expect(page.locator('article')).toBeVisible() // Main content wrapper
await expect(page.locator('.prose')).toBeVisible() // Prose container
```

---

### Test 2: Legal page is responsive on mobile

**Preconditions:**
- Route `/privacy` exists
- Viewport set to mobile (375x667)

**Steps:**
1. Set viewport to mobile size
2. Navigate to `/privacy`

**Expected:**
- Content card uses `p-6` padding (not `p-8`)
- Text is readable, no horizontal scroll
- Neo-Brutal shadow is visible but not cut off
- Footer is visible at bottom

**Playwright selectors:**
```typescript
await page.setViewportSize({ width: 375, height: 667 })
await page.goto('/privacy')
await expect(page.locator('main')).toBeVisible()
// Check no horizontal overflow
const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
const clientWidth = await page.evaluate(() => document.body.clientWidth)
expect(scrollWidth).toBe(clientWidth)
```

---

### Test 3: HTML content from Markdown is rendered correctly

**Preconditions:**
- Markdown file `content/legal/en/terms.md` contains:
  - H1 heading
  - Paragraphs
  - Lists (ul/ol)
  - Bold text
  - Links

**Steps:**
1. Navigate to `/terms`
2. Inspect rendered HTML

**Expected:**
- H1 is converted to `<h1>` tag
- H2 headings are `<h2>` with bold font
- Paragraphs are `<p>` tags
- Lists are `<ul>` or `<ol>` with `<li>` items
- Bold text uses `<strong>` tags
- Links are `<a href="...">` with underline styling

**Playwright selectors:**
```typescript
await expect(page.locator('article h2').first()).toBeVisible()
await expect(page.locator('article p').first()).toBeVisible()
await expect(page.locator('article ul li').first()).toBeVisible()
await expect(page.locator('article a').first()).toHaveAttribute('href')
```

---

### Test 4: Legal page includes Header and Footer

**Preconditions:**
- Route `/cookies` exists
- Header component shows logo and language selector
- Footer component shows links to terms/privacy

**Steps:**
1. Navigate to `/cookies`

**Expected:**
- Header is visible at top
  - Logo/site name is visible
  - Language selector is present
- Footer is visible at bottom
  - Links to `/terms` and `/privacy` are present
  - Copyright text is visible

**Playwright selectors:**
```typescript
await expect(page.locator('header')).toBeVisible()
await expect(page.locator('footer')).toBeVisible()
await expect(page.locator('footer a[href="/terms"]')).toBeVisible()
await expect(page.locator('footer a[href="/privacy"]')).toBeVisible()
```

---

### Test 5: dangerouslySetInnerHTML does not create XSS vulnerability

**Preconditions:**
- Markdown file contains potentially dangerous content (already sanitized by DOMPurify)
- Example: `<script>alert('xss')</script>` in Markdown source

**Steps:**
1. Add test Markdown file with script tag
2. Navigate to test route
3. Check that script did NOT execute

**Expected:**
- Script tags are stripped by DOMPurify before reaching component
- No alert appears
- Content is safe HTML

**Note:** This test verifies the service layer (Task 11.2), not the component itself, but ensures end-to-end safety.

**Playwright test:**
```typescript
// This is tested at the service level in tests/e2e/legal-content-service.spec.ts
// No additional E2E test needed for component
```

---

## Implementation Checklist

- [x] Create `app/components/legal/` directory
- [x] Create `LegalPageLayout.tsx` component
- [x] Implement Neo-Brutal card structure with shadow layer
- [x] Apply Tailwind `prose` classes with Neo-Brutal overrides
- [x] Add responsive padding (mobile: p-6, desktop: p-8)
- [x] Verify component accepts `html` and `title` props
- [x] Ensure `dangerouslySetInnerHTML` is used correctly
- [x] Test component renders with sample HTML
- [x] Verify Neo-Brutal styling matches design system (borders, colors, shadows)
- [x] Verify responsive layout on mobile and desktop
- [x] Component is ready for integration in routes (Tasks 11.4, 11.5, 11.6)

---

## Notes

1. **Header and Footer inclusion:**
   - Header is already rendered globally by `app/root.tsx` (unless `hideLayout: true` handle is set)
   - This component does NOT need to render Header explicitly
   - Footer is also rendered globally by `app/root.tsx`
   - Both will appear automatically when routes use this layout

2. **Prose plugin configuration:**
   - `@tailwindcss/typography` is already installed (confirmed in project)
   - No additional Tailwind config changes needed
   - Custom prose overrides are applied via className utilities

3. **Performance:**
   - Component is stateless, minimal re-renders
   - No JavaScript interaction, pure SSR-friendly
   - HTML is pre-rendered on server, client only hydrates

4. **Future enhancements (out of scope):**
   - Table of contents generation (extract H2/H3 from HTML)
   - Breadcrumbs ("Home > Terms")
   - Print-friendly styles
   - "Last updated" date display
   - Anchor links for headings

---

## Definition of Done

1. ✅ Component file created at `app/components/legal/LegalPageLayout.tsx`
2. ✅ Component accepts `html` and `title` props (TypeScript interfaces defined)
3. ✅ Component renders HTML with `dangerouslySetInnerHTML` safely
4. ✅ Neo-Brutal styling applied: border-[3px], bg-neo-panel, solid shadow
5. ✅ Tailwind `prose` classes applied for typography
6. ✅ Responsive design: max-w-3xl, mobile and desktop padding
7. ✅ Component is reusable (no hard-coded page-specific content)
8. ✅ `npm run typecheck` passes
9. ✅ `npm run lint` passes
10. ✅ Component ready for integration in Tasks 11.4, 11.5, 11.6

**Test Verification (in subsequent tasks):**
- E2E tests will verify rendering when integrated in routes
- Visual regression: compare with design system standards
- Accessibility: check heading hierarchy, color contrast

---

## Dependencies

**Requires completion of:**
- ✅ Task 11.1 - Markdown infrastructure (content files exist)
- ✅ Task 11.2 - Legal content service (`getLegalContent()` function)

**Blocks:**
- ⏸️ Task 11.4 - Terms route (needs this component)
- ⏸️ Task 11.5 - Privacy route (needs this component)
- ⏸️ Task 11.6 - Cookies route (needs this component)

---

## Lessons from KNOWN_ISSUES.md Applied

1. **Route modules degenerate into "god components":**
   - ✅ This component is ONLY presentation, no logic
   - ✅ Service handles parsing/sanitization (Task 11.2)
   - ✅ Routes will only compose this component (Tasks 11.4-11.6)

2. **Duplicate Headers in Route Modules:**
   - ✅ Component does NOT render Header
   - ✅ Relies on `root.tsx` global layout
   - ✅ No need to check `hideLayout` handle

3. **Neo-Brutal Panel Text Contrast:**
   - ✅ Use `text-gray-700` for body text on `bg-neo-panel`
   - ✅ Use `text-neo-dark` for headings (full contrast)
   - ✅ Links use `text-neo-primary` with underline for visibility

4. **Mobile Overflow in Dashboard Grids:**
   - ✅ Use `max-w-3xl mx-auto` to constrain width
   - ✅ Apply `px-4` for mobile padding
   - ✅ No grid layouts in this component (simple vertical flow)

---

## Example Usage (Preview)

```tsx
// In future routes (Tasks 11.4, 11.5, 11.6)
export async function loader({ request }: LoaderFunctionArgs) {
  const locale = await getLocale(request) // From i18n
  const content = getLegalContent('terms', locale)

  return {
    html: content.html,
    title: content.title,
    description: content.description
  }
}

export default function TermsRoute() {
  const { html, title } = useLoaderData<typeof loader>()

  return <LegalPageLayout html={html} title={title} />
}
```

This keeps routes as "puzzles" - thin, composing only.
