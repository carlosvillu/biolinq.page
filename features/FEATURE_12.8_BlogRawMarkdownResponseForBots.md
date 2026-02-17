# FEATURE_12.8_BlogRawMarkdownResponseForBots

## 1. Natural Language Description

Actualmente, la ruta de post de blog siempre procesa el archivo Markdown y devuelve HTML sanitizado para renderizar la página.

Con esta feature queremos soportar consumo por bots de IA: cuando la request indique explícitamente Markdown (`Content-Type: text/markdown` o `Accept: text/markdown`), la app debe devolver el archivo Markdown en crudo (incluyendo frontmatter), sin convertirlo a HTML.

Estado inicial:
- `/blog/:lang/:slug` devuelve contenido HTML renderizable para navegador.
- El servicio de blog parsea frontmatter/body y transforma body a HTML.

Estado final esperado:
- Se mantiene el comportamiento actual por defecto (HTML).
- Si la request pide Markdown, la misma ruta devuelve raw markdown completo.
- La respuesta Markdown añade `X-Robots-Tag: noindex` para evitar indexación accidental.

## 2. Technical Description

Se implementará negociación de formato en el loader de la ruta de post de blog, usando headers de request:
- `Content-Type` contiene `text/markdown`, o
- `Accept` contiene `text/markdown`.

Cuando se detecte modo Markdown:
- El loader devolverá un `Response` de texto plano Markdown (`text/markdown; charset=utf-8`).
- El contenido vendrá desde servicio de blog como archivo completo (frontmatter + body).
- Se aplicará `X-Robots-Tag: noindex`.
- Se mantendrá la política de caché existente para blog post.

Cuando NO se detecte modo Markdown:
- Se mantiene el flujo actual sin cambios funcionales (parse + sanitize + render HTML).

No hay cambios de UI ni i18n. No se crean rutas nuevas.

## 2.1. Architecture Gate

- **Pages are puzzles:** `app/routes/blog.post.tsx` sigue siendo una composición mínima; solo decide formato de respuesta y delega la obtención de contenido al servicio.
- **Loaders/actions are thin:** el loader parsea headers/request, decide HTML vs Markdown, llama a servicios y devuelve `data(...)` o `Response`.
- **Business logic is not in components:** la lógica de acceso a contenido raw/HTML queda en `app/services/blog-content.server.ts`; el componente de ruta solo renderiza en modo HTML.

Detalle por módulo:
- **Route module `blog.post.tsx`:**
  - Loader llama a `getBlogPost(...)` para HTML o a nuevo método de servicio para raw markdown.
  - Component compone `BlogPostLayout` + `RelatedPosts` solo en el flujo HTML.
- **Componentes (`BlogPostLayout`, `RelatedPosts`):** sin lógica de negociación de formato ni lectura de archivos.

## 3. Files to Change/Create

### `app/services/blog-content.server.ts`
**Objective:** Exponer una API de servicio para obtener el archivo Markdown completo (frontmatter + body) del post, reutilizando validaciones de seguridad y resolución por locale/fallback.

**Pseudocode:**
```pseudocode
FUNCTION getBlogPostRawMarkdown(slug, locale)
  INPUT: slug string, locale Locale
  PROCESS:
    VALIDATE slug with existing SLUG_REGEX
    RESOLVE file path with existing locale fallback strategy
    IF file path not found -> RETURN null
    READ file as utf-8
  OUTPUT: { markdown: fullFileContent, meta: BlogPostMeta } | null

  NOTE:
    Reuse existing frontmatter parsing + zod validation to keep metadata contract strict
    Keep current getBlogPost() behavior unchanged
END
```

**Additional planning rules (MUST follow):**
- Service define inputs/outputs explícitos y códigos de error semánticos:
  - `null` para slug inválido o archivo no encontrado
  - `throw Error` para frontmatter inválido (igual al comportamiento actual)

### `app/routes/blog.post.tsx`
**Objective:** Implementar content negotiation por headers para devolver HTML (default) o Markdown raw (modo bot IA) sin romper SEO/UX del flujo actual.

**Pseudocode:**
```pseudocode
LOADER(request, params)
  VALIDATE locale and slug

  DETECT wantsMarkdown:
    contentTypeHeader = request.headers['content-type']
    acceptHeader = request.headers['accept']
    wantsMarkdown = contentTypeHeader includes 'text/markdown'
                    OR acceptHeader includes 'text/markdown'

  IF wantsMarkdown:
    rawPost = service.getBlogPostRawMarkdown(slug, locale)
    IF rawPost is null -> THROW 404

    RETURN Response(rawPost.markdown, headers={
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'X-Robots-Tag': 'noindex'
    })

  post = service.getBlogPost(slug, locale)
  IF post is null -> THROW 404

  relatedPosts = service.getRelatedPosts(...)
  translationSlugs = service.getTranslationSlugs(...)

  RETURN data({ post, relatedPosts, locale, translationSlugs }, existing cache headers)
END

ACTION
  No action changes required
END

COMPONENT BlogPostPage
  USE loader data (HTML flow only)
  RENDER BlogPostLayout + RelatedPosts
  NO business rules, NO markdown negotiation logic here
END
```

### `tests/e2e/blog-post.spec.ts`
**Objective:** Añadir cobertura de regresión para negociación de formato sin romper el flujo HTML existente.

**Pseudocode:**
```pseudocode
TEST default request returns HTML page
  PRECONDITION seeded blog post exists
  STEP navigate to /blog/en/:slug in browser
  EXPECT heading/content visible as current behavior

TEST request with Accept text/markdown returns raw markdown
  PRECONDITION seeded blog post exists
  STEP use APIRequestContext GET with header Accept=text/markdown
  EXPECT status 200
  EXPECT content-type includes text/markdown
  EXPECT body starts with frontmatter delimiter '---'
  EXPECT body contains markdown tokens not transformed to HTML (e.g. '# ')
  EXPECT x-robots-tag == noindex

TEST request with Content-Type text/markdown returns raw markdown
  PRECONDITION seeded blog post exists
  STEP use APIRequestContext GET with header Content-Type=text/markdown
  EXPECT same assertions as previous markdown test

TEST invalid slug/locale in markdown mode still returns 404
  PRECONDITION none
  STEP GET markdown-mode request to non-existing slug or invalid locale
  EXPECT 404
END
```

## 4. E2E Test Plan

### Test: Blog post default flow still renders HTML
- **Preconditions:** Existe un post de blog válido en fixtures/contenido disponible para test.
- **Steps:**
  1. Navegar a `/blog/en/{slug}` sin headers especiales.
  2. Verificar render visual del post.
- **Expected result:** La página se renderiza en HTML como hasta ahora.

### Test: Accept header triggers raw markdown response
- **Preconditions:** Existe un post de blog válido.
- **Steps:**
  1. Hacer GET a `/blog/en/{slug}` con `Accept: text/markdown`.
  2. Leer body y headers de respuesta.
- **Expected result:**
  - `200 OK`
  - `Content-Type` markdown
  - Body devuelve archivo completo (incluye frontmatter)
  - `X-Robots-Tag: noindex`

### Test: Content-Type header triggers raw markdown response
- **Preconditions:** Existe un post de blog válido.
- **Steps:**
  1. Hacer GET a `/blog/en/{slug}` con `Content-Type: text/markdown`.
  2. Leer body y headers de respuesta.
- **Expected result:** Mismo resultado que en modo `Accept`.

### Test: Markdown mode preserves 404 semantics
- **Preconditions:** Ninguna.
- **Steps:**
  1. Hacer request Markdown a slug inexistente o locale inválido.
- **Expected result:** `404` (sin fallback a respuesta 200 vacía).
