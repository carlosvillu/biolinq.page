# FEATURE_11.4_CreateTermsRoute.md

## 1. Natural Language Description

### Current State
- El servicio `legal-content.server.ts` ya existe y puede cargar contenido Markdown desde `content/legal/{locale}/{page}.md`
- El componente `LegalPageLayout.tsx` ya existe y renderiza HTML sanitizado con estilos Neo-Brutal
- Los archivos de contenido `content/legal/en/terms.md` y `content/legal/es/terms.md` ya existen
- El Footer tiene un link a `/terms` pero la ruta no existe (devuelve 404)
- No hay ruta `/terms` registrada en `app/routes.ts`

### Expected End State
- Nueva ruta `/terms` funcionando que muestra los Términos de Servicio
- El contenido se carga en el idioma del usuario (detectado por cookie `lang` o header `Accept-Language`)
- SEO meta tags configurados (title, description)
- Tests E2E verificando que la página renderiza correctamente en ambos idiomas

---

## 2. Technical Description

### Approach
Crear una ruta simple que:
1. En el loader: detecta el locale del usuario usando las funciones existentes de `app/lib/i18n.ts`
2. Llama a `getLegalContent('terms', locale)` para obtener el HTML y título
3. Retorna los datos al componente
4. El componente renderiza `LegalPageLayout` con los datos

### Architecture Decisions
- **Thin loader**: Solo detecta locale, llama al servicio, retorna datos
- **No business logic in component**: El componente solo compone `LegalPageLayout`
- **Reuse existing infrastructure**: `detectLocale`, `parseLangCookie`, `getLegalContent`, `LegalPageLayout`

---

## 2.1. Architecture Gate

- **Pages are puzzles:** La ruta `legal.terms.tsx` solo compone `LegalPageLayout`, sin UI propia.
- **Loaders/actions are thin:** El loader solo parsea la cookie, detecta locale, llama al servicio y retorna.
- **Business logic is not in components:** La lógica de carga de contenido está en `legal-content.server.ts`.

### Route Module Breakdown
- **`app/routes/legal.terms.tsx`**
  - **Loader calls:** `parseLangCookie()`, `detectLocale()`, `getLegalContent()`
  - **Component composes:** `LegalPageLayout`
  - **No business logic in component:** Solo pasa props del loader al layout

---

## 3. Files to Change/Create

### `app/routes/legal.terms.tsx`
**Objective:** Crear la ruta que renderiza la página de Términos de Servicio

**Pseudocode:**
```pseudocode
// IMPORTS
IMPORT LoaderFunctionArgs, useLoaderData FROM 'react-router'
IMPORT parseLangCookie, detectLocale, Locale FROM '~/lib/i18n'
IMPORT getLegalContent, LegalPage FROM '~/services/legal-content.server'
IMPORT LegalPageLayout FROM '~/components/legal/LegalPageLayout'

// META FUNCTION
FUNCTION meta({ data })
  IF data EXISTS
    RETURN [
      { title: data.title + " | BioLinq" },
      { name: "description", content: data.description }
    ]
  END
  RETURN [{ title: "Terms of Service | BioLinq" }]
END

// LOADER
FUNCTION loader({ request }: LoaderFunctionArgs)
  // 1. Get cookie header
  cookieHeader = request.headers.get('Cookie')
  
  // 2. Parse lang cookie
  langCookie = parseLangCookie(cookieHeader)
  
  // 3. Detect locale
  locale = detectLocale(request, langCookie)
  
  // 4. Get legal content
  content = getLegalContent('terms', locale AS Locale)
  
  // 5. Return data
  RETURN { html: content.html, title: content.title, description: content.description }
END

// COMPONENT
FUNCTION TermsPage()
  data = useLoaderData<typeof loader>()
  
  RETURN <LegalPageLayout html={data.html} title={data.title} />
END

EXPORT DEFAULT TermsPage
```

---

### `app/routes.ts`
**Objective:** Registrar la nueva ruta `/terms`

**Pseudocode:**
```pseudocode
// ADD new route entry BEFORE the catch-all ':username' route
route('terms', 'routes/legal.terms.tsx')
```

**Note:** La ruta debe ir ANTES de `':username'` para que no sea capturada por el catch-all.

---

## 4. I18N

### Existing keys to reuse
- No se necesitan nuevas keys de i18n para esta tarea
- El contenido viene de los archivos Markdown en `content/legal/{locale}/terms.md`
- Los títulos y descripciones se extraen del contenido Markdown

### New keys to create
Ninguna. El contenido legal está en archivos Markdown, no en el sistema de i18n.

---

## 5. E2E Test Plan

### Test File: `tests/e2e/legal-terms.spec.ts`

### Test: Terms page renders in English by default
- **Preconditions:** No language cookie set, browser Accept-Language not set or set to English
- **Steps:**
  1. Navigate to `/terms`
  2. Wait for page to load
- **Expected:**
  - Page title contains "Terms of Service"
  - H1 heading shows "Terms of Service"
  - Content includes "Acceptance of Terms" section
  - Page has Neo-Brutal styling (card with shadow)

### Test: Terms page renders in Spanish when language changed
- **Preconditions:** Language cookie set to 'es' OR Accept-Language header is 'es'
- **Steps:**
  1. Set language cookie to 'es' via `context.addCookies()`
  2. Navigate to `/terms`
  3. Wait for page to load
- **Expected:**
  - Page title contains "Términos de Servicio"
  - H1 heading shows "Términos de Servicio"
  - Content is in Spanish

### Test: Terms page has correct meta tags
- **Preconditions:** None
- **Steps:**
  1. Navigate to `/terms`
  2. Check document title
  3. Check meta description
- **Expected:**
  - Document title is "Terms of Service | BioLinq"
  - Meta description exists and is not empty

### Test: Footer link navigates to terms page
- **Preconditions:** None
- **Steps:**
  1. Navigate to `/` (home page)
  2. Click on "Terms" link in footer
- **Expected:**
  - URL changes to `/terms`
  - Terms page content is displayed

---

## 6. Definition of Done

- [ ] `app/routes/legal.terms.tsx` created with loader and component
- [ ] Route registered in `app/routes.ts` before catch-all
- [ ] E2E tests pass for English rendering
- [ ] E2E tests pass for Spanish rendering
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
