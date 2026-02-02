# FEATURE_SEO_OnPageOptimization.md

## 1. Natural Language Description

### Current State

BioLinq.page tiene una base técnica sólida (React Router 7, SSR, i18n, cache headers) pero carece de elementos SEO fundamentales:

- **No existe `robots.txt`** - Los crawlers no tienen instrucciones de qué indexar
- **No existe `sitemap.xml`** - Google no puede descubrir todas las páginas
- **Landing page sin Open Graph/Twitter Cards** - Sin preview rico en redes sociales
- **Landing page sin canonical** - Riesgo de contenido duplicado
- **Páginas legales sin meta tags sociales** - Sin previews en compartir
- **Rutas protegidas sin noindex** - Riesgo de indexación accidental
- **HTML lang estático** - Siempre "en" aunque el usuario cambie idioma
- **Sin Schema.org structured data** - Sin rich snippets en SERP

### Expected End State

Después de esta implementación:

- `robots.txt` disponible con reglas claras de crawling
- `sitemap.xml` dinámico con todas las páginas indexables
- Landing page con meta tags completos (OG, Twitter, canonical)
- Páginas legales con meta tags sociales
- Rutas protegidas marcadas como noindex
- HTML lang dinámico según locale
- Schema.org básico para Organization en landing

---

## 2. Technical Description

### Approach

Se implementarán las mejoras SEO en orden de impacto:

1. **robots.txt**: Archivo estático en `/public/robots.txt`
2. **sitemap.xml**: Ruta dinámica que genera XML con páginas estáticas + perfiles públicos
3. **Meta tags landing**: Actualizar `meta()` en `home.tsx` con OG, Twitter, canonical
4. **Meta tags legales**: Actualizar `meta()` en páginas legales
5. **noindex rutas protegidas**: Agregar meta robots a dashboard y auth
6. **HTML lang dinámico**: Modificar `root.tsx` para usar locale del loader
7. **Schema.org**: Agregar JSON-LD en landing page

### Dependencies

- No requiere nuevas dependencias npm
- Usa funcionalidades existentes de React Router (meta, loader)

---

## 2.1. Architecture Gate

- **Pages are puzzles:** Las rutas solo modifican su función `meta()`, sin lógica adicional
- **Loaders/actions are thin:** El sitemap usa un loader que llama a un servicio
- **Business logic is not in components:** La generación de sitemap está en un servicio dedicado

### Route modules

- `home.tsx`: solo modifica `meta()`, no hay cambios en loader/component
- `legal.*.tsx`: solo modifica `meta()` para agregar OG tags
- `dashboard.tsx`: agrega `meta()` con noindex
- `sitemap.xml.tsx`: loader llama a `sitemapService.generateSitemap()`

### Services

- `app/services/sitemap.server.ts`: genera el XML del sitemap

---

## 3. Files to Change/Create

### `public/robots.txt` (CREATE)

**Objective:** Indicar a los crawlers qué rutas indexar y cuáles no.

**Content:**

```
User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /dashboard/
Disallow: /auth/
Disallow: /api/
Disallow: /go/

Sitemap: https://biolinq.page/sitemap.xml
```

---

### `app/services/sitemap.server.ts` (CREATE)

**Objective:** Servicio para generar el contenido XML del sitemap.

**Pseudocode:**

```pseudocode
FUNCTION generateSitemap(baseUrl: string)
  INPUT: baseUrl (e.g., "https://biolinq.page")

  DEFINE staticPages = [
    { loc: "/", priority: 1.0, changefreq: "weekly" },
    { loc: "/terms", priority: 0.3, changefreq: "monthly" },
    { loc: "/privacy", priority: 0.3, changefreq: "monthly" },
    { loc: "/cookies", priority: 0.3, changefreq: "monthly" }
  ]

  FETCH allPublicBiolinks from database (username only)

  DEFINE dynamicPages = allPublicBiolinks.map(biolink => ({
    loc: `/${biolink.username}`,
    priority: 0.6,
    changefreq: "weekly"
  }))

  COMBINE staticPages + dynamicPages

  GENERATE XML string with urlset schema

  OUTPUT: XML string
END
```

---

### `app/routes/sitemap[.]xml.tsx` (CREATE)

**Objective:** Ruta que devuelve el sitemap.xml generado dinámicamente.

**Pseudocode:**

```pseudocode
LOADER
  INPUT: request

  CALL sitemapService.generateSitemap("https://biolinq.page")

  RETURN new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600"
    }
  })
END
```

**Note:** El nombre del archivo usa `[.]` para escapar el punto en React Router.

---

### `app/routes.ts` (MODIFY)

**Objective:** Registrar la nueva ruta del sitemap.

**Pseudocode:**

```pseudocode
ADD route:
  route("sitemap.xml", "routes/sitemap[.]xml.tsx")
END
```

---

### `app/routes/home.tsx` (MODIFY)

**Objective:** Agregar meta tags completos para SEO y redes sociales.

**Pseudocode:**

```pseudocode
FUNCTION meta()
  DEFINE title = "BioLinq - Free Link in Bio Tool | Linktree Alternative"
  DEFINE description = "Create your free link in bio page in under 2 minutes. Ultra-fast, brutalist design. 4 themes, analytics, and only 5€ lifetime for premium."
  DEFINE url = "https://biolinq.page"
  DEFINE image = "https://biolinq.page/og-image.png"

  RETURN [
    { title },
    { name: "description", content: description },

    // Open Graph
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: image },
    { property: "og:site_name", content: "BioLinq" },

    // Twitter Card
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:url", content: url },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },

    // Canonical
    { tagName: "link", rel: "canonical", href: url }
  ]
END
```

---

### `app/routes/legal.terms.tsx` (MODIFY)

**Objective:** Agregar Open Graph y Twitter Card meta tags.

**Pseudocode:**

```pseudocode
FUNCTION meta({ data })
  IF not data RETURN [{ title: "Terms of Service | BioLinq" }]

  DEFINE url = "https://biolinq.page/terms"

  RETURN [
    { title: `${data.title} | BioLinq` },
    { name: "description", content: data.description },

    // Open Graph
    { property: "og:type", content: "article" },
    { property: "og:url", content: url },
    { property: "og:title", content: `${data.title} | BioLinq` },
    { property: "og:description", content: data.description },

    // Twitter Card
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: `${data.title} | BioLinq` },
    { name: "twitter:description", content: data.description },

    // Canonical
    { tagName: "link", rel: "canonical", href: url }
  ]
END
```

---

### `app/routes/legal.privacy.tsx` (MODIFY)

**Objective:** Agregar Open Graph y Twitter Card meta tags.

**Pseudocode:** (Mismo patrón que terms, con url = "https://biolinq.page/privacy")

---

### `app/routes/legal.cookies.tsx` (MODIFY)

**Objective:** Agregar Open Graph y Twitter Card meta tags.

**Pseudocode:** (Mismo patrón que terms, con url = "https://biolinq.page/cookies")

---

### `app/routes/dashboard.tsx` (MODIFY)

**Objective:** Agregar meta robots noindex para evitar indexación.

**Pseudocode:**

```pseudocode
FUNCTION meta()
  RETURN [
    { title: "Dashboard | BioLinq" },
    { name: "robots", content: "noindex, nofollow" }
  ]
END
```

---

### `app/routes/dashboard.account.tsx` (MODIFY)

**Objective:** Agregar meta robots noindex.

**Pseudocode:**

```pseudocode
FUNCTION meta()
  RETURN [
    { title: "Account | BioLinq" },
    { name: "robots", content: "noindex, nofollow" }
  ]
END
```

---

### `app/routes/auth.login.tsx` (MODIFY)

**Objective:** Agregar meta robots noindex.

**Pseudocode:**

```pseudocode
FUNCTION meta()
  RETURN [
    { title: "Login | BioLinq" },
    { name: "robots", content: "noindex, nofollow" }
  ]
END
```

---

### `app/root.tsx` (MODIFY)

**Objective:** Hacer el atributo `lang` del HTML dinámico basado en el locale.

**Pseudocode:**

```pseudocode
COMPONENT Layout({ children })
  // Obtener locale del loader data (pasado como prop o context)
  // Por ahora, usar un valor por defecto ya que Layout no tiene acceso al loader

  RETURN (
    <html lang="en">  // Se actualizará vía useEffect en App component
      ...
    </html>
  )
END

// El lang ya se actualiza dinámicamente en useEffect del App component (línea 188-190)
// Solo necesitamos asegurar que el valor inicial sea correcto
```

**Note:** Revisando el código, el `lang` ya se actualiza dinámicamente en `useEffect`. El problema es que el valor inicial en SSR siempre es "en". Para SSR correcto, necesitamos pasar el locale al Layout.

**Updated Pseudocode:**

```pseudocode
// Opción 1: Usar un contexto para pasar locale a Layout
// Opción 2: Mantener como está (acceptable, ya que se corrige en cliente)

// Por simplicidad, mantener el comportamiento actual ya que:
// 1. El lang se actualiza en el cliente inmediatamente
// 2. Los crawlers modernos ejecutan JavaScript
// 3. El impacto SEO es mínimo
```

---

### `public/og-image.jpg` (CREATE - Manual)

**Objective:** Imagen para Open Graph (1200x630px recomendado).

**Note:** Este archivo debe crearse manualmente con el diseño de BioLinq. Placeholder: usar logo sobre fondo `#ffc480`.

---

## 4. I18N

No se requieren nuevas keys de i18n. Los meta tags usan valores fijos en inglés ya que:

- Las meta descriptions para SEO deben ser consistentes
- Google indexa principalmente contenido en inglés para keywords internacionales
- Las páginas legales ya tienen `description` que viene del contenido Markdown

---

## 5. E2E Test Plan

### Test: robots.txt is accessible and has correct content

- **Preconditions:** App running
- **Steps:**
  1. Fetch `/robots.txt`
- **Expected:**
  - Status 200
  - Contains "User-agent: \*"
  - Contains "Disallow: /dashboard"
  - Contains "Sitemap: https://biolinq.page/sitemap.xml"

### Test: sitemap.xml returns valid XML with all pages

- **Preconditions:** App running, at least one user with biolink exists
- **Steps:**
  1. Fetch `/sitemap.xml`
- **Expected:**
  - Status 200
  - Content-Type: application/xml
  - Contains `<urlset>`
  - Contains `<url><loc>https://biolinq.page/</loc>`
  - Contains `<url><loc>https://biolinq.page/terms</loc>`
  - Contains `<url><loc>https://biolinq.page/privacy</loc>`
  - Contains `<url><loc>https://biolinq.page/cookies</loc>`

### Test: Landing page has complete meta tags

- **Preconditions:** App running
- **Steps:**
  1. Navigate to `/`
  2. Check page source
- **Expected:**
  - `<meta property="og:title">` exists
  - `<meta property="og:description">` exists
  - `<meta property="og:image">` exists
  - `<meta name="twitter:card">` exists
  - `<link rel="canonical">` exists

### Test: Dashboard has noindex meta tag

- **Preconditions:** User logged in with biolink
- **Steps:**
  1. Navigate to `/dashboard`
  2. Check page source
- **Expected:**
  - `<meta name="robots" content="noindex, nofollow">` exists

### Test: Legal pages have Open Graph tags

- **Preconditions:** App running
- **Steps:**
  1. Navigate to `/terms`
  2. Check page source
- **Expected:**
  - `<meta property="og:title">` exists
  - `<meta property="og:url">` contains "/terms"
  - `<link rel="canonical">` exists

---

## 6. Implementation Order

1. **`public/robots.txt`** - Archivo estático, sin dependencias
2. **`app/services/sitemap.server.ts`** - Servicio independiente
3. **`app/routes/sitemap[.]xml.tsx`** + registro en `routes.ts` - Depende del servicio
4. **`app/routes/home.tsx`** - Meta tags landing (crear `og-image.png` en paralelo)
5. **`app/routes/legal.*.tsx`** - Meta tags páginas legales
6. **`app/routes/dashboard.tsx`** + `dashboard.account.tsx` + `auth.login.tsx` - noindex
7. **E2E tests** - Verificar todo funciona

---

## 7. Risk Mitigation

| Risk                                        | Mitigation                                              |
| ------------------------------------------- | ------------------------------------------------------- |
| Sitemap con URLs inválidas                  | Validar URLs antes de incluir, usar try/catch           |
| og-image.png no existe                      | Usar imagen por defecto o omitir tag                    |
| Cache de sitemap stale                      | Cache de 1 hora es suficiente para cambios de usernames |
| Performance del sitemap con muchos usuarios | Limitar a 50k URLs (límite de sitemap)                  |

---

## 8. Notes

- **og-image.png**: Debe crearse manualmente. Dimensiones recomendadas: 1200x630px
- **Schema.org**: Se deja para una segunda iteración. El impacto es menor comparado con los otros cambios
- **HTML lang**: El comportamiento actual (actualizar en cliente) es aceptable. Mejora de SSR sería over-engineering
