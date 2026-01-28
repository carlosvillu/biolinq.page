# FEATURE_11.2_legal_content_service.md

## 1. Natural Language Description

Actualmente, los archivos Markdown de contenido legal (Terms, Privacy, Cookies) existen en `content/legal/{locale}/{page}.md`, pero no hay infraestructura del lado del servidor para cargarlos, parsearlos y entregarlos a las rutas.

Después de esta tarea, existirá un servicio server-side (`app/services/legal-content.server.ts`) que:
- Lee archivos Markdown desde el sistema de archivos
- Parsea Markdown a HTML con sanitización de seguridad
- Extrae el título del primer H1
- Extrae la descripción del primer párrafo (para meta tags)
- Implementa fallback a inglés si el locale solicitado no existe
- Devuelve un objeto estructurado `{ html, title, description }` listo para consumir en las rutas

Este servicio será el único punto de acceso al contenido legal, asegurando consistencia, seguridad y mantenibilidad.

---

## 2. Technical Description

### Approach

Implementaremos un servicio server-only que abstrae toda la lógica de carga y procesamiento de contenido legal. El flujo será:

1. La route (e.g., `legal.terms.tsx`) llama a `getLegalContent('terms', 'es')`
2. El servicio construye la ruta del archivo: `content/legal/es/terms.md`
3. Si el archivo no existe, hace fallback a `content/legal/en/terms.md`
4. Lee el contenido del archivo con `fs.readFileSync`
5. Parsea Markdown → HTML con `marked`
6. Sanitiza el HTML con `isomorphic-dompurify` para prevenir XSS
7. Extrae el título del primer `<h1>` con regex
8. Extrae la descripción del primer `<p>` con regex
9. Devuelve `{ html, title, description }`

### Dependencies

- **marked** - Ya instalado (Task 11.1), usado para parsear Markdown a HTML
- **isomorphic-dompurify** - Necesita instalación, sanitiza HTML para prevenir XSS
- **Node.js fs** - Lectura del sistema de archivos (server-only)
- **Node.js path** - Construcción de rutas absolutas

### Key Design Decisions

1. **Server-only**: Este servicio usa `fs` y es `.server.ts`, nunca se ejecuta en el cliente
2. **Fallback a inglés**: Si `es/terms.md` no existe, intenta `en/terms.md`. Si tampoco existe, lanza error
3. **Sanitización obligatoria**: Aunque controlamos el contenido, sanitizamos por principio de seguridad
4. **Extracción de meta tags**: Automatizada desde el HTML parseado para evitar duplicación manual

---

## 2.1. Architecture Gate

- **Pages are puzzles**: Las rutas legales (`legal.terms.tsx`, `legal.privacy.tsx`, `legal.cookies.tsx`) serán composición mínima: llaman al servicio en el loader y renderizan el componente `LegalPageLayout` (Task 11.3).

- **Loaders/actions are thin**:
  - Loader: detecta el locale, llama a `getLegalContent(page, locale)`, devuelve `{ html, title, description }`
  - No hay action (páginas de solo lectura)
  - No hay lógica de negocio en el loader, solo orquestación

- **Business logic is not in components**:
  - La lógica de carga de archivos, parsing, sanitización, extracción de meta tags, y fallback está en `app/services/legal-content.server.ts`
  - El componente `LegalPageLayout` (Task 11.3) solo renderiza HTML con `dangerouslySetInnerHTML`
  - No hay hooks necesarios (páginas estáticas)

---

## 3. Files to Change/Create

### `app/services/legal-content.server.ts` (NEW)

**Objective:** Servicio server-side que lee, parsea y procesa contenido legal Markdown.

**Pseudocode:**

```pseudocode
IMPORT fs from 'node:fs'
IMPORT path from 'node:path'
IMPORT { marked } from 'marked'
IMPORT createDOMPurify from 'isomorphic-dompurify'

TYPE LegalContent = {
  html: string      // HTML sanitizado del contenido
  title: string     // Extraído del primer <h1>
  description: string // Extraído del primer <p>
}

TYPE LegalPage = 'terms' | 'privacy' | 'cookies'
TYPE Locale = 'en' | 'es'

FUNCTION getLegalContent(page: LegalPage, locale: Locale): LegalContent
  // 1. Construct file path
  baseDir = path.join(process.cwd(), 'content', 'legal')
  filePath = path.join(baseDir, locale, `${page}.md`)

  // 2. Check if file exists, fallback to English
  IF NOT fs.existsSync(filePath) THEN
    filePath = path.join(baseDir, 'en', `${page}.md`)

    IF NOT fs.existsSync(filePath) THEN
      THROW new Error(`Legal content not found: ${page}`)
    END IF
  END IF

  // 3. Read file content
  markdownContent = fs.readFileSync(filePath, 'utf-8')

  // 4. Parse Markdown to HTML
  rawHtml = marked.parse(markdownContent)

  // 5. Sanitize HTML
  DOMPurify = createDOMPurify()
  sanitizedHtml = DOMPurify.sanitize(rawHtml)

  // 6. Extract title from first <h1>
  titleMatch = sanitizedHtml.match(/<h1[^>]*>(.*?)<\/h1>/)
  title = titleMatch ? titleMatch[1].trim() : 'Legal Information'

  // 7. Extract description from first <p>
  descriptionMatch = sanitizedHtml.match(/<p[^>]*>(.*?)<\/p>/)
  description = descriptionMatch
    ? descriptionMatch[1].trim().substring(0, 160) + '...'
    : ''

  // 8. Return structured content
  RETURN {
    html: sanitizedHtml,
    title: title,
    description: description
  }
END FUNCTION

EXPORT getLegalContent
```

**Additional Notes:**

- Usar `process.cwd()` para construir la ruta base desde la raíz del proyecto
- `marked.parse()` convierte Markdown a HTML síncrono
- `isomorphic-dompurify` funciona tanto en Node.js como en el navegador
- La descripción se trunca a 160 caracteres para meta tags (estándar SEO)
- Si no hay H1 o párrafo, usa valores por defecto en lugar de fallar

---

### `package.json` (MODIFY - si falta la dependencia)

**Objective:** Asegurar que `isomorphic-dompurify` está instalado.

**Pseudocode:**

```pseudocode
IF 'isomorphic-dompurify' NOT in dependencies THEN
  RUN: npm install isomorphic-dompurify
  RUN: npm install --save-dev @types/dompurify
END IF
```

**Additional Notes:**

- Verificar primero con `grep "isomorphic-dompurify" package.json`
- Solo instalar si no existe
- Los tipos de TypeScript pueden estar en `@types/dompurify`

---

## 4. I18N Section

### Existing keys to reuse

- `footer_terms` - Ya usado en `Footer.tsx` para el link "Terms"
- `footer_privacy` - Ya usado en `Footer.tsx` para el link "Privacy"

### New keys to create

| Key | English | Spanish |
|-----|---------|---------|
| `footer_cookies` | Cookies | Cookies |

**Explanation:**

La key `footer_cookies` será necesaria en Task 11.6 cuando se agregue el link al footer. Las otras dos páginas (Terms, Privacy) ya tienen sus keys definidas en el sistema de i18n.

El contenido de las páginas legales (el Markdown en sí) no usa las keys de i18n porque son documentos completos, no fragmentos de UI. Los títulos y textos están en los archivos `.md` correspondientes a cada idioma.

---

## 5. E2E Test Plan

### Test 1: getLegalContent() loads English Terms successfully

**Preconditions:**
- File `content/legal/en/terms.md` exists
- Service `legal-content.server.ts` is implemented

**Steps:**
1. Call test endpoint que invoca `getLegalContent('terms', 'en')`
2. Verify response contains `{ html, title, description }`

**Expected Result:**
- HTTP 200
- `html` contains sanitized HTML (includes `<h1>Terms of Service</h1>`)
- `title` equals "Terms of Service"
- `description` is a non-empty string
- No XSS vulnerabilities (sanitized output)

---

### Test 2: Fallback to English when Spanish file doesn't exist (edge case)

**Preconditions:**
- File `content/legal/en/terms.md` exists
- Temporarily rename `content/legal/es/terms.md` (or request non-existent locale)

**Steps:**
1. Call `getLegalContent('terms', 'fr')` (unsupported locale)
2. Verify fallback to English

**Expected Result:**
- HTTP 200
- `html` contains English content from `en/terms.md`
- `title` is in English ("Terms of Service")
- No errors thrown

---

### Test 3: Error thrown when no files exist for page

**Preconditions:**
- Files `content/legal/en/nonexistent.md` and `es/nonexistent.md` do NOT exist

**Steps:**
1. Call `getLegalContent('nonexistent', 'en')`
2. Catch error

**Expected Result:**
- Function throws Error with message "Legal content not found: nonexistent"
- Does not crash the server

---

### Test 4: HTML sanitization prevents XSS

**Preconditions:**
- Create temporary test file with malicious script: `<script>alert('XSS')</script>`

**Steps:**
1. Call `getLegalContent()` on file with script tag
2. Inspect `html` output

**Expected Result:**
- `html` does NOT contain `<script>` tag
- Sanitizer removes dangerous tags and attributes
- Safe HTML tags remain intact (e.g., `<p>`, `<h1>`, `<a>`)

---

### Test 5: Meta extraction works correctly

**Preconditions:**
- File contains `# My Title` and `This is the first paragraph.`

**Steps:**
1. Call `getLegalContent()`
2. Inspect `title` and `description`

**Expected Result:**
- `title` equals "My Title"
- `description` starts with "This is the first paragraph."
- `description` is truncated to ~160 characters

---

## 6. Security Considerations

### XSS Prevention

Aunque los archivos `.md` están bajo nuestro control, implementamos sanitización obligatoria con `isomorphic-dompurify` como capa de seguridad adicional. Esto previene:

1. Inyección accidental de scripts durante desarrollo
2. Vulnerabilidades si en el futuro se permite contenido dinámico
3. Problemas si un archivo `.md` es comprometido en el repositorio

### File System Security

- Solo leer archivos desde `content/legal/` (nunca permitir path traversal)
- Validar que `page` sea uno de los valores permitidos: `'terms' | 'privacy' | 'cookies'`
- Validar que `locale` sea uno de los soportados: `'en' | 'es'`
- Usar `path.join()` para construir rutas de forma segura

---

## 7. Performance Considerations

### Caching (Opcional - Fuera del scope de esta task)

El contenido legal es estático y no cambia frecuentemente. En el futuro se podría:

- Implementar caching en memoria con `lru-cache`
- Cargar todos los archivos en memoria al startup
- Usar la cache de React Router (loader caching)

Para esta task, la lectura del filesystem es aceptable dado que:
- Son solo 6 archivos pequeños (3 páginas × 2 idiomas)
- El acceso a archivos en producción es rápido (SSR)
- React Router puede cachear el resultado del loader

### Build-time pre-processing (Opcional - No en esta task)

Otra alternativa futura sería parsear los archivos `.md` en build time con Vite plugins, pero añade complejidad innecesaria para un caso de uso tan simple.

---

## 8. Acceptance Criteria

Esta task se considera completa cuando:

- [ ] File `app/services/legal-content.server.ts` existe y está implementado
- [ ] `isomorphic-dompurify` está instalado si no estaba
- [ ] Función `getLegalContent(page, locale)` devuelve `{ html, title, description }`
- [ ] Markdown se parsea correctamente a HTML con `marked`
- [ ] HTML se sanitiza con `isomorphic-dompurify`
- [ ] Fallback a inglés funciona cuando el archivo del locale solicitado no existe
- [ ] Título se extrae del primer `<h1>` del HTML
- [ ] Descripción se extrae del primer `<p>` y se trunca a 160 caracteres
- [ ] Error se lanza cuando ningún archivo existe para el `page` solicitado
- [ ] 5 tests E2E pasan correctamente
- [ ] `npm run typecheck` pasa sin errores
- [ ] `npm run lint` pasa sin errores

---

## 9. Dependencies on Other Tasks

**Depends on:**
- Task 11.1 ✅ (Markdown infrastructure y archivos `.md` ya existen)

**Blocks:**
- Task 11.3 (Legal Page Layout Component - necesita `{ html, title }` de este servicio)
- Task 11.4 (Terms Route - usará este servicio en su loader)
- Task 11.5 (Privacy Route - usará este servicio en su loader)
- Task 11.6 (Cookies Route - usará este servicio en su loader)

---

## 10. Out of Scope

Lo siguiente NO está incluido en esta task:

- Creación de rutas (`legal.*.tsx`) → Task 11.4-11.6
- Creación del componente de layout (`LegalPageLayout.tsx`) → Task 11.3
- Actualización del Footer con link a Cookies → Task 11.6
- Implementación de caching del contenido → Optimización futura
- Build-time processing → Optimización futura
- Soporte para más idiomas (e.g., `fr`, `de`) → Futura feature
- Markdown extensions (e.g., Table of Contents) → No requerido por el PRD
