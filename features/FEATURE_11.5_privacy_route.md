# FEATURE_11.5_privacy_route.md

## 1. Natural Language Description

### Current State

El footer de BioLinq tiene un enlace a `/privacy` que actualmente devuelve 404. Los archivos de contenido Markdown ya existen en `content/legal/en/privacy.md` y `content/legal/es/privacy.md`, y el servicio `legal-content.server.ts` ya puede procesarlos.

### Expected End State

La ruta `/privacy` funcionará correctamente, mostrando la Política de Privacidad en inglés o español según la cookie de idioma del usuario. La página usará el mismo layout Neo-Brutal que la página de Términos, con detección automática de idioma y meta tags SEO optimizados.

---

## 2. Technical Description

Esta tarea implementa la ruta de Privacy Policy siguiendo exactamente el mismo patrón que la ruta de Terms (Task 11.4). Es una implementación directa sin complejidad adicional:

1. Crear el route module `legal.privacy.tsx` que:
   - Detecta el idioma del usuario mediante cookie `lang` o header `Accept-Language`
   - Llama al servicio `getLegalContent('privacy', locale)` para obtener el HTML sanitizado
   - Retorna data para SSR con title + description para meta tags
   - Renderiza el componente `LegalPageLayout` con el contenido

2. Registrar la ruta `/privacy` en `app/routes.ts`

3. Crear tests E2E que verifican:
   - Renderizado en inglés por defecto
   - Renderizado en español cuando existe cookie `lang=es`
   - Meta tags correctos (title, description)
   - Navegación desde footer funciona correctamente

**No hay cambios arquitectónicos.** Esta tarea reutiliza 100% de la infraestructura existente:
- `getLegalContent()` service (ya implementado)
- `LegalPageLayout` component (ya implementado)
- Detección de locale via `detectLocale()` (ya implementado)
- Archivos Markdown ya existen (`privacy.md` en inglés y español)

---

## 2.1. Architecture Gate

### Route Module (`legal.privacy.tsx`)

- **Pages are puzzles:** El route module NO tiene UI propia, solo compone `LegalPageLayout` con la data del loader.
- **Loaders/actions are thin:**
  - El `loader` solo parsea la cookie, decide locale, llama a `getLegalContent()` service y retorna data estructurada.
  - NO implementa lógica de parsing de Markdown ni sanitización (eso está en el servicio).
- **Business logic is not in components:**
  - Toda la lógica de lectura de archivos, parsing Markdown y sanitización HTML está en `app/services/legal-content.server.ts`.
  - El componente `LegalPageLayout` solo renderiza HTML sanitizado (presentational).

**Files to modify:**

- `app/routes/legal.privacy.tsx` - Llama a `getLegalContent('privacy', locale)` service y compone `LegalPageLayout`
- `app/routes.ts` - Registra la ruta `/privacy`
- `tests/e2e/legal-privacy.spec.ts` - Tests E2E que verifican renderizado y navegación

**This is NOT a move-only refactor.** Esta tarea crea nueva funcionalidad (nueva ruta).

---

## 3. Files to Change/Create

### `app/routes/legal.privacy.tsx`

**Objective:** Crear el route module para la página de Privacy Policy. Debe detectar el idioma del usuario, cargar el contenido apropiado desde el servicio, y renderizarlo usando el layout existente.

**Pseudocode:**

```pseudocode
IMPORTS
  - LoaderFunctionArgs, MetaFunction from 'react-router'
  - useLoaderData from 'react-router'
  - detectLocale, parseLangCookie, Locale from '~/lib/i18n'
  - getLegalContent from '~/services/legal-content.server'
  - LegalPageLayout from '~/components/legal/LegalPageLayout'

FUNCTION meta(args: { data })
  IF data is null or undefined
    RETURN [{ title: 'Privacy Policy | BioLinq' }]

  RETURN [
    { title: `${data.title} | BioLinq` },
    { name: 'description', content: data.description }
  ]
END

ASYNC FUNCTION loader(args: LoaderFunctionArgs)
  // 1. Detect locale from cookie or Accept-Language header
  cookieHeader = request.headers.get('Cookie')
  langCookie = parseLangCookie(cookieHeader)
  locale = detectLocale(request, langCookie)

  // 2. Load legal content for 'privacy' page
  content = getLegalContent('privacy', locale as Locale)

  // 3. Return structured data for SSR
  RETURN {
    html: content.html,
    title: content.title,
    description: content.description
  }
END

FUNCTION PrivacyPage()
  data = useLoaderData<typeof loader>()

  // Render legal page layout with loaded content
  RETURN <LegalPageLayout html={data.html} title={data.title} />
END

EXPORT meta, loader, PrivacyPage as default
```

---

### `app/routes.ts`

**Objective:** Registrar la nueva ruta `/privacy` para que React Router la reconozca.

**Pseudocode:**

```pseudocode
// Add new route after the 'terms' route
EXISTING:
  route('terms', 'routes/legal.terms.tsx'),

ADD:
  route('privacy', 'routes/legal.privacy.tsx'),
```

**Implementation note:** Insertar la línea `route('privacy', 'routes/legal.privacy.tsx'),` después de la línea 22 (términos) en el archivo routes.ts.

---

### `tests/e2e/legal-privacy.spec.ts`

**Objective:** Crear tests E2E que verifican que la página de Privacy se renderiza correctamente en ambos idiomas, tiene meta tags adecuados, y es accesible desde el footer.

**Pseudocode:**

```pseudocode
IMPORT test, expect from '../fixtures'

CONST PRIVACY_PATH = '/privacy'

DESCRIBE 'Privacy Policy page'

  TEST 'renders English privacy policy by default'
    NAVIGATE to PRIVACY_PATH

    ASSERT page title contains 'Privacy Policy'
    ASSERT H1 heading with text 'Privacy Policy' is visible
    ASSERT text 'Information We Collect' is visible (first H2 in content)

    ASSERT article element is visible (Neo-Brutal card)
  END

  TEST 'renders Spanish privacy policy when lang cookie is es'
    SET cookie 'lang' = 'es' for baseURL
    NAVIGATE to PRIVACY_PATH

    ASSERT page title contains 'Política de Privacidad'
    ASSERT H1 heading with text 'Política de Privacidad' is visible
    ASSERT text 'Información que Recopilamos' is visible (first H2 in Spanish)
  END

  TEST 'sets meta tags correctly'
    NAVIGATE to PRIVACY_PATH

    ASSERT page title is 'Privacy Policy | BioLinq'
    ASSERT meta[name="description"] has non-empty content attribute
  END

  TEST 'footer link navigates to privacy page'
    NAVIGATE to '/' (home page)

    // Dismiss cookie banner if present (same pattern as terms test)
    TRY
      CLICK button with text /reject|rechazar/i with timeout 2000ms
      WAIT for button to disappear
    CATCH
      // Banner might not be visible, continue
    END

    // Use force click as fallback if banner intercepts
    CLICK link with text /privacy/i with force: true

    ASSERT page URL is PRIVACY_PATH
    ASSERT H1 heading with text 'Privacy Policy' is visible
  END
END
```

**Implementation notes:**

- Seguir exactamente la misma estructura que `legal-terms.spec.ts`
- Usar las mismas estrategias para manejar el cookie consent banner (dismiss + force click)
- Verificar headings específicos del contenido de privacy.md para garantizar que el contenido correcto se cargó

---

## 4. I18N Section

**No se requieren nuevas claves i18n** para esta tarea. Las claves existentes en `app/locales/en.json` y `app/locales/es.json` son suficientes:

### Existing keys to reuse

| Key               | English       | Spanish       | Usage                        |
|-------------------|---------------|---------------|------------------------------|
| `footer_privacy`  | Privacy       | Privacy       | Footer link text             |

**Note:** El título de la página ("Privacy Policy" / "Política de Privacidad") se extrae del contenido Markdown (`privacy.md`), no de las claves i18n. Esto mantiene la consistencia con el patrón establecido en Task 11.4.

---

## 5. E2E Test Plan

### Test 1: Privacy page renders correctly in English by default

**Preconditions:**
- Server is running
- Privacy Markdown files exist (`content/legal/en/privacy.md`)
- No `lang` cookie is set

**Steps:**
1. Navigate to `/privacy`
2. Wait for page to load

**Expected result:**
- Page title is "Privacy Policy | BioLinq"
- H1 heading displays "Privacy Policy"
- Content from `privacy.md` is rendered (verify by checking for "Information We Collect" text)
- Neo-Brutal card styling is applied (article element with border-neo-dark)
- Meta description tag exists and is non-empty

---

### Test 2: Privacy page changes language with selector / cookie

**Preconditions:**
- Server is running
- Spanish Privacy Markdown file exists (`content/legal/es/privacy.md`)

**Steps:**
1. Set cookie `lang=es` for the domain
2. Navigate to `/privacy`
3. Wait for page to load

**Expected result:**
- Page title is "Política de Privacidad | BioLinq"
- H1 heading displays "Política de Privacidad"
- Content is in Spanish (verify by checking for "Información que Recopilamos" text)

---

### Test 3: Footer link navigates to Privacy page

**Preconditions:**
- Server is running
- User is on home page (`/`)

**Steps:**
1. Navigate to `/` (home page)
2. Dismiss cookie consent banner if present (click "Reject" button)
3. Click on "Privacy" link in footer (use force click if banner intercepts)
4. Wait for navigation

**Expected result:**
- URL changes to `/privacy`
- Privacy Policy page loads successfully
- H1 heading "Privacy Policy" is visible
- No 404 error

---

### Test 4: Meta tags are set correctly for SEO

**Preconditions:**
- Server is running

**Steps:**
1. Navigate to `/privacy`
2. Inspect HTML `<head>` section

**Expected result:**
- `<title>` tag contains "Privacy Policy | BioLinq"
- `<meta name="description">` tag exists
- Description content is extracted from first paragraph of privacy.md (truncated to ~160 chars)
- No console errors or warnings

---

## 6. Definition of Done

- [ ] `app/routes/legal.privacy.tsx` creado con loader y meta function
- [ ] `/privacy` route registered in `app/routes.ts`
- [ ] `tests/e2e/legal-privacy.spec.ts` creado con 4 tests (English, Spanish, meta tags, footer navigation)
- [ ] `npm run test:e2e` passes (including new legal-privacy.spec.ts tests)
- [ ] `npm run typecheck` passes (no TypeScript errors)
- [ ] `npm run lint` passes (no ESLint errors)
- [ ] Manual verification: `/privacy` page loads in browser with Neo-Brutal styling
- [ ] Manual verification: Language switching works (English ↔ Spanish)
- [ ] PLANNING.md Task 11.5 marked as complete by user

---

## 7. Notes

- Esta tarea es prácticamente idéntica a Task 11.4 (Terms Route), solo cambia el parámetro `'terms'` → `'privacy'` en la llamada a `getLegalContent()`
- No hay complejidad arquitectónica; toda la infraestructura ya existe
- Los archivos Markdown (`privacy.md`) ya fueron creados en Task 11.1, por lo que solo necesitamos crear el route module y tests
- El componente `LegalPageLayout` es reutilizable y no requiere modificaciones
