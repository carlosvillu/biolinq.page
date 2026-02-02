# Auditoría SEO Completa - BioLinq.page

**Fecha:** 2026-02-01
**URL Auditada:** https://biolinq.page
**Tipo de Sitio:** SaaS - Link-in-bio tool (alternativa minimalista a Linktree)
**Objetivo de Negocio:** Adquisición orgánica + conversión Free → Premium (5€)

---

## Resumen Ejecutivo

### Estado General: 🟡 MEDIO (65/100)

**Fortalezas:**
- ✅ Performance técnico excelente (~300ms tiempo de carga)
- ✅ Estructura de meta tags implementada en páginas públicas `/:username`
- ✅ Cache strategy óptima (60s public, 3600s CDN)
- ✅ HTTPS configurado correctamente con HSTS

**Debilidades Críticas:**
- 🔴 **NO existe robots.txt** (404)
- 🔴 **NO existe sitemap.xml** (404)
- 🔴 **NO hay Schema markup** en ninguna página
- 🔴 **Landing page tiene meta tags básicos** pero sin Schema de Organización/Producto
- 🟡 Estrategia de contenido SEO inexistente para adquisición orgánica

### Top 3 Prioridades

1. **CRÍTICO:** Crear robots.txt y sitemap.xml dinámico
2. **ALTA:** Implementar Schema.org markup (Organization, SoftwareApplication, FAQPage)
3. **ALTA:** Estrategia de contenido programático SEO para long-tail keywords

---

## 1. Technical SEO

### 1.1 Crawlability & Indexation

#### 🔴 CRÍTICO: robots.txt Missing

**Estado:** Devuelve 404

**Impacto:** Alto
**Evidencia:**
```bash
curl -I https://biolinq.page/robots.txt
# HTTP/2 404
```

**Problema:**
- Los crawlers no encuentran directrices de rastreo
- No hay referencia al sitemap
- Pierde oportunidad de comunicar content signals (search, ai-input, ai-train)

**Fix Recomendado:**

Crear `app/routes/robots[.]txt.ts`:

```typescript
import type { LoaderFunctionArgs } from 'react-router'

export function loader({ request }: LoaderFunctionArgs) {
  const host = new URL(request.url).host
  const protocol = request.url.startsWith('https') ? 'https' : 'http'

  const robotsTxt = `
# Content Signals (C2PA Content Credentials)
# search: yes - Allow indexing for search results
# ai-input: yes - Allow use in AI-generated answers (RAG, grounding)
# ai-train: no - Do not use for training AI models

User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /api/
Disallow: /go/

# Allow all public profiles
Allow: /$

Sitemap: ${protocol}://${host}/sitemap.xml
`.trim()

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
```

**Agregar a `app/routes.ts`:**
```typescript
route('robots.txt', 'routes/robots[.]txt.ts'),
```

**Prioridad:** 🔥 Crítica (implementar HOY)

---

#### 🔴 CRÍTICO: sitemap.xml Missing

**Estado:** Devuelve 404

**Impacto:** Alto
**Evidencia:** No hay sitemap accesible, ni referencia en HTML ni robots.txt

**Problema:**
- Google no puede descubrir eficientemente las páginas `/:username`
- No hay priorización de URLs
- Las nuevas páginas de usuario no se descubren automáticamente

**Fix Recomendado:**

Crear `app/routes/sitemap[.]xml.ts`:

```typescript
import type { LoaderFunctionArgs } from 'react-router'
import { getAllPublicBiolinks } from '~/services/username.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const host = new URL(request.url).host
  const protocol = request.url.startsWith('https') ? 'https' : 'http'
  const baseUrl = `${protocol}://${host}`

  // Obtener todos los biolinks públicos
  const biolinks = await getAllPublicBiolinks()

  const staticPages = [
    { url: baseUrl, priority: 1.0, changefreq: 'weekly' },
    { url: `${baseUrl}/terms`, priority: 0.3, changefreq: 'monthly' },
    { url: `${baseUrl}/privacy`, priority: 0.3, changefreq: 'monthly' },
    { url: `${baseUrl}/cookies`, priority: 0.3, changefreq: 'monthly' },
  ]

  const dynamicPages = biolinks.map((biolink) => ({
    url: `${baseUrl}/${biolink.username}`,
    priority: 0.8,
    changefreq: 'daily',
    lastmod: biolink.updatedAt.toISOString(),
  }))

  const allPages = [...staticPages, ...dynamicPages]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod || new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
```

**Necesitarás crear `getAllPublicBiolinks()` en `app/services/username.server.ts`:**

```typescript
export async function getAllPublicBiolinks() {
  return db.query.biolinks.findMany({
    columns: {
      username: true,
      updatedAt: true,
    },
    orderBy: (biolinks, { desc }) => [desc(biolinks.updatedAt)],
  })
}
```

**Agregar a `app/routes.ts`:**
```typescript
route('sitemap.xml', 'routes/sitemap[.]xml.ts'),
```

**Prioridad:** 🔥 Crítica (implementar HOY)

---

### 1.2 URL Structure & Canonicalization

#### ✅ BIEN: Canonical tags en páginas públicas

**Evidencia:**
```typescript
// app/routes/public.tsx:80
{ tagName: 'link', rel: 'canonical', href: pageUrl },
```

Cada perfil público tiene su canonical correctamente implementado.

---

#### 🟡 MEJORAR: Manejo de www vs non-www

**Estado:** Funciona, pero sin redirect explícito

**Recomendación:** Verificar en Netlify que existe redirect de www → non-www (o viceversa) para consolidar señales SEO.

**En `netlify.toml` o `public/_redirects`:**
```
https://www.biolinq.page/* https://biolinq.page/:splat 301!
```

---

### 1.3 Site Speed & Core Web Vitals

#### ✅ EXCELENTE: Performance

**Evidencia:**
```bash
curl -w "Time: %{time_total}s\n" https://biolinq.page/
# Time: 0.297669s
```

**Análisis:**
- **Tiempo de carga:** ~300ms (objetivo PRD: <500ms) ✅
- **Cache-Control:** Implementado correctamente en páginas públicas
- **CDN:** Cloudflare activo
- **SSR + Client hydration:** React Router 7 optimizado

**Fortalezas detectadas en código:**
- Lazy loading de analytics (defer)
- Minimal JS en páginas públicas
- Cache strategy granular (`Cache-Control: public, max-age=60, s-maxage=3600`)
- Fonts preconnect

**Quick Win:** Considerar preload de hero image si existe:
```typescript
{ rel: 'preload', as: 'image', href: '/hero.webp' }
```

---

### 1.4 Mobile-Friendliness

#### ✅ BIEN: Responsive design

**Evidencia:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1"/>
```

Implementación con Tailwind CSS garantiza responsive.

---

### 1.5 Security & HTTPS

#### ✅ EXCELENTE

**Evidencia:**
```
strict-transport-security: max-age=31536000
x-content-type-options: nosniff
```

HTTPS activo, HSTS configurado, headers de seguridad presentes.

---

## 2. On-Page SEO

### 2.1 Meta Tags

#### ✅ BIEN: Homepage

**Evidencia:**
```typescript
// app/routes/home.tsx:20-28
export function meta() {
  return [
    { title: 'BioLinq - The minimalist Linktree' },
    {
      name: 'description',
      content: 'Ultra-fast, brutalist design link-in-bio pages. Stand out by being simple.',
    },
  ]
}
```

**Análisis:**
- **Title:** 36 caracteres - ✅ Óptimo
- **Description:** 78 caracteres - 🟡 Podría expandirse a 150-160 caracteres

**Recomendación mejorada:**
```typescript
{
  name: 'description',
  content: 'Create your minimalist link-in-bio page in under 2 minutes. Fast, brutalist design, no subscriptions. Free plan or €5 lifetime premium. The simple alternative to Linktree.',
}
// 159 caracteres - aprovecha mejor el espacio SERP
```

---

#### ✅ EXCELENTE: Páginas públicas `/:username`

**Evidencia:**
```typescript
// app/routes/public.tsx:55-82
export const meta: MetaFunction<typeof loader> = ({ data, error }) => {
  return [
    { title: `${userName} | BioLinq` },
    { name: 'description', content: description },
    { property: 'og:title', content: userName },
    { property: 'og:description', content: description },
    { property: 'og:image', content: avatarUrl },
    { property: 'og:url', content: pageUrl },
    { property: 'og:type', content: 'profile' },
    { name: 'twitter:card', content: 'summary' },
    { tagName: 'link', rel: 'canonical', href: pageUrl },
  ]
}
```

**Análisis:**
- Title dinámico ✅
- Description contextual ✅
- Open Graph completo ✅
- Twitter Cards ✅
- Canonical ✅

**Único problema:** 404 pages tienen `noindex` ✅ (correcto)

---

### 2.2 Heading Structure

**No puedo auditar sin ver el HTML renderizado de componentes, pero basándome en PRD:**

**Recomendación:** Verificar que:
1. Landing tenga un solo H1: "Your online presence shouldn't be a monthly bill"
2. Secciones usen H2 (Problem, Solution, Pricing, etc.)
3. No haya saltos de nivel (H1 → H3)

**Acción:** Ejecutar lighthouse audit o inspeccionar manualmente.

---

### 2.3 Internal Linking

#### 🟡 MEJORABLE: Arquitectura de links

**Problema detectado:**
- Landing → Auth/Dashboard
- Landing → Legal (footer)
- **NO HAY** contenido educativo/SEO que enlace hacia landing
- **NO HAY** enlaces desde páginas públicas `/:username` hacia landing (más allá del watermark en Free)

**Oportunidad:**
Según PRD v1.2, crear landing pages SEO:
- `/for/musicians` → "BioLinq for Musicians"
- `/for/artists` → "BioLinq for Artists"
- `/for/creators` → "BioLinq for Content Creators"
- `/vs/linktree` → "BioLinq vs Linktree"
- `/vs/beacons` → "BioLinq vs Beacons"

Estas páginas:
1. Rankean para long-tail keywords
2. Enlazan internamente a homepage y CTA signup
3. Generan topical authority

---

## 3. Schema Markup (Structured Data)

### 🔴 CRÍTICO: Sin Schema.org markup

**Estado:** No existe en ninguna página

**Impacto:** Alto
**Problema:**
- Google no entiende que BioLinq es un SoftwareApplication
- No aparece en Rich Results
- Pierde oportunidad de mostrar Rating, Price, FAQ en SERPs

**Fix Recomendado:**

#### Homepage - Organization + SoftwareApplication

Agregar a `app/routes/home.tsx`:

```typescript
export function meta() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'BioLinq',
        url: 'https://biolinq.page',
        logo: 'https://biolinq.page/android/icon-512.png',
        sameAs: [
          // Agregar redes sociales cuando existan
        ],
      },
      {
        '@type': 'SoftwareApplication',
        name: 'BioLinq',
        applicationCategory: 'BusinessApplication',
        offers: [
          {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'EUR',
            name: 'Free Plan',
          },
          {
            '@type': 'Offer',
            price: '5.00',
            priceCurrency: 'EUR',
            name: 'Premium (Lifetime)',
          },
        ],
        operatingSystem: 'Web Browser',
        description: 'Ultra-fast, brutalist design link-in-bio pages. Stand out by being simple.',
      },
    ],
  }

  return [
    { title: 'BioLinq - The minimalist Linktree' },
    { name: 'description', content: '...' },
    {
      'script:ld+json': schema,
    },
  ]
}
```

---

#### Páginas públicas - ProfilePage

Agregar a `app/routes/public.tsx`:

```typescript
export const meta: MetaFunction<typeof loader> = ({ data, error }) => {
  if (error || !data) return [...]

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: data.user.name,
      image: data.user.image,
      url: `https://biolinq.page/${data.biolink.username}`,
    },
  }

  return [
    // ... existing meta tags
    {
      'script:ld+json': schema,
    },
  ]
}
```

**Prioridad:** 🔥 Alta (implementar esta semana)

---

## 4. Contenido & SEO On-Page

### 🔴 CRÍTICO: Sin estrategia de contenido SEO

**Problema:**
El sitio solo tiene:
- Homepage (landing)
- Páginas públicas `/:username` (no indexables para adquisición)
- Legal pages (no generan tráfico)

**No hay contenido para rankear keywords como:**
- "linktree alternative"
- "free link in bio"
- "bio link tool"
- "linktree vs biolinq"
- "link in bio for musicians"
- "best link in bio 2026"

**Oportunidad según PRD:**

### Estrategia de Programmatic SEO (Roadmap v1.2)

Crear landing pages dinámicas:

#### Template: `/for/:niche`

**URLs:**
- `/for/musicians`
- `/for/artists`
- `/for/podcasters`
- `/for/streamers`
- `/for/freelancers`
- `/for/coaches`

**Estructura:**
```
H1: BioLinq for {Niche} - Simple, Fast, No Subscriptions

H2: Why {Niche} Choose BioLinq
- Specific pain points for niche
- Examples: "Share your Spotify, Bandcamp, merch store in one link"

H2: How {Niche} Use BioLinq
- Screenshots/examples of profiles in this niche
- Testimonials (if available)

H3: Pricing for {Niche}
- Same pricing, but framed for niche needs

CTA: Create Your {Niche} BioLinq
```

**Meta Title:** `BioLinq for {Niche} | Free Link-in-Bio Tool`
**Meta Description:** `The minimalist link-in-bio page for {niche}. Fast, simple, no monthly fees. Join {count} {niche} using BioLinq.`

---

#### Template: `/vs/:competitor`

**URLs:**
- `/vs/linktree`
- `/vs/beacons`
- `/vs/later`
- `/vs/tap-bio`

**Estructura:**
```
H1: BioLinq vs {Competitor}: Honest Comparison

H2: Feature Comparison Table
[Table comparing features]

H2: Why Choose BioLinq Over {Competitor}
- No subscriptions
- Faster
- Brutalist design advantage

H2: Why You Might Choose {Competitor}
- Be honest about their advantages
- Build trust

H3: Pricing Comparison

CTA: Try BioLinq Free
```

**Meta Title:** `BioLinq vs {Competitor} 2026: Honest Comparison`
**Meta Description:** `Comparing BioLinq and {Competitor} features, pricing, and performance. See which link-in-bio tool is right for you.`

---

#### Blog/Resource Content

**URLs:**
- `/blog/how-to-optimize-bio-link`
- `/blog/instagram-bio-link-best-practices`
- `/blog/link-in-bio-analytics-guide`

**Objetivo:**
- Rankear informational keywords
- Enlazar a homepage/signup
- Establecer topical authority

---

**Prioridad:** 🟡 Media (implementar en v1.2, según roadmap PRD)

---

## 5. Problemas Detectados en Código

### 5.1 🟡 Página 404 personalizada sin enlaces internos

**Evidencia:**
```typescript
// app/routes/public.tsx:107-115
export function ErrorBoundary() {
  const error = useRouteError()
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <PublicNotFound />
  }
  return <PublicError />
}
```

**Problema:** No vi el componente `PublicNotFound`, pero basándome en el sitemap test anterior, muestra "Profile not found" con CTA a claim username.

**Recomendación:** La página 404 debería incluir:
- Enlaces a homepage
- Búsqueda de usernames populares/sugeridos
- Enlaces a `/for/*` pages cuando existan

---

### 5.2 ✅ BIEN: Cache strategy granular

**Evidencia:**
```typescript
// app/routes/public.tsx:36-41
if (!isPreview) {
  headers.set('Cache-Control', 'public, max-age=60, s-maxage=3600')
  headers.set('Surrogate-Key', `biolink-${result.biolink.id}`)
} else {
  headers.set('Cache-Control', 'no-store')
}
```

Estrategia óptima: 1 min browser cache, 1 hora CDN.

---

## 6. Oportunidades de Quick Wins

### 6.1 🟢 Agregar FAQ Schema

Crear `/faq` page o sección en homepage con Schema:

```json
{
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is BioLinq really free?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, BioLinq is free forever with up to 5 links. Premium is €5 one-time."
      }
    },
    {
      "@type": "Question",
      "name": "How is BioLinq different from Linktree?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "BioLinq is faster, simpler, and has no monthly fees. We focus on minimalism."
      }
    }
  ]
}
```

**Beneficio:** Aparece en SERPs con acordeón desplegable.

---

### 6.2 🟢 Social proof como señal SEO

Si tienes X usuarios, agregar en homepage:

```html
<script type="application/ld+json">
{
  "@type": "SoftwareApplication",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "127"
  }
}
</script>
```

**Beneficio:** Estrellas en SERPs.

---

### 6.3 🟢 Meta tags mejorados para compartir social

Agregar a homepage:

```typescript
{ property: 'og:image', content: 'https://biolinq.page/og-image.png' },
{ property: 'og:image:width', content: '1200' },
{ property: 'og:image:height', content: '630' },
{ name: 'twitter:card', content: 'summary_large_image' },
```

**Acción:** Crear `og-image.png` (1200x630) con diseño neo-brutal.

---

## 7. Plan de Acción Priorizado

### 🔥 CRÍTICO (Esta semana)

1. **Crear robots.txt** → 30 min
   - Archivo: `app/routes/robots[.]txt.ts`
   - Incluir content signals
   - Referenciar sitemap

2. **Crear sitemap.xml dinámico** → 2 horas
   - Archivo: `app/routes/sitemap[.]xml.ts`
   - Service: `getAllPublicBiolinks()`
   - Incluir páginas estáticas + dinámicas

3. **Implementar Schema markup** → 3 horas
   - Organization + SoftwareApplication en homepage
   - ProfilePage en páginas públicas
   - Validar con Google Rich Results Test

### 🟡 ALTA (Este mes)

4. **Expandir meta description homepage** → 15 min
   - De 78 a 150-160 caracteres
   - Incluir keywords

5. **Crear og-image.png** → 1 hora
   - Diseño neo-brutal 1200x630
   - Agregar meta tags

6. **Verificar heading structure** → 1 hora
   - Lighthouse audit
   - Corregir si hay problemas

7. **Configurar redirect www → non-www** → 15 min
   - Netlify redirects

### 🟢 MEDIA (Próximo sprint)

8. **FAQ Schema + page** → 4 horas
   - Crear `/faq` route
   - Schema FAQPage
   - 10-15 preguntas comunes

9. **Primeras landing pages SEO** → 8 horas/página
   - `/for/musicians`
   - `/vs/linktree`
   - Template reusable

### 🔵 BAJA (Backlog)

10. **Blog/resource content** → Ongoing
11. **Link building strategy** → Ongoing
12. **Google Search Console monitoring** → Setup + monthly reviews

---

## 8. Métricas de Seguimiento

### SEO KPIs (medir mensualmente)

| Métrica | Herramienta | Objetivo 3 meses |
|---------|-------------|------------------|
| Páginas indexadas | Search Console | 500+ (landing + usuarios) |
| Impresiones orgánicas | Search Console | 10,000/mes |
| Clicks orgánicos | Search Console | 500/mes |
| CTR promedio | Search Console | >3% |
| Posición promedio | Search Console | <20 para branded |
| Core Web Vitals | PageSpeed Insights | 100% "Good" URLs |
| Backlinks | Ahrefs/Semrush | 20+ dominios |

### Keywords objetivo (branded)

- "biolinq" (posición 1)
- "biolinq.page" (posición 1)
- "biolinq vs linktree" (top 10)

### Keywords objetivo (non-branded)

- "linktree alternative" (top 20)
- "free link in bio" (top 30)
- "minimalist link in bio" (top 10)
- "link in bio no subscription" (top 20)

---

## 9. Herramientas Recomendadas

### Gratis (implementar ya)
- ✅ Google Search Console (verificar propiedad)
- ✅ Google Analytics 4 (ya implementado: G-WT17JSN3W9)
- Google Rich Results Test
- Google PageSpeed Insights
- Bing Webmaster Tools

### Paid (considerar si budget permite)
- Ahrefs Webmaster Tools (gratis, limitado)
- Semrush (keyword research)

---

## 10. Riesgos SEO

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Duplicate content (`/:username`) | Baja | Medio | Canonical + unique descriptions |
| Spam/abusive profiles | Media | Alto | Moderation + reportar a Google |
| Thin content en landing | Baja | Medio | Expandir con FAQs, comparisons |
| Penalización por AI content | Baja | Alto | Human review de todo contenido SEO |

---

## Conclusión

BioLinq.page tiene una **base técnica sólida** (performance, cache, HTTPS) pero carece de **fundamentos SEO críticos** (robots.txt, sitemap, Schema) y **estrategia de contenido orgánico**.

**Implementando las fixes críticas esta semana**, el sitio estará listo para crecer orgánicamente. Las landing pages SEO (v1.2) serán el **multiplicador de adquisición** sin coste en ads.

**Tiempo estimado total:**
- Crítico: ~6 horas
- Alta: ~8 horas
- Media: ~20 horas
- **Total MVP SEO:** ~34 horas (~5 días)

Alineado con estimación PRD de "Esfuerzo Medio".

---

**Próximos pasos:**
1. Revisar este informe
2. Priorizar fixes críticos
3. Implementar según plan de acción
4. Configurar Search Console
5. Medir resultados mensualmente
