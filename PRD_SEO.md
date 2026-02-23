# PRD: Sistema Automatizado de Generación de Blog Posts SEO

## Executive Summary

Crear un sistema automatizado que genere y publique artículos de blog semanalmente para BioLinq.page, siguiendo una estrategia SEO predefinida. El sistema usa **GitHub Actions con cron configurable** y un **script personalizado en Node.js (@anthropic-ai/sdk)** para generar contenido en inglés, traducirlo automáticamente al español, generar imágenes de cover con Nano Banana Pro, y crear un PR para revisión humana antes de publicar.

## Problem Statement

BioLinq.page es un SaaS nuevo sin tráfico orgánico. El blog ya existe (`/blog/:lang/:slug`) con posts en markdown, pero crearlos manualmente (EN + ES) no escala. Se necesita automatizar la producción de contenido SEO para ejecutar la estrategia de 100+ keywords definida en `estrategia_seo_biolinq.md`.

## Goals & Success Metrics

**Goals:**
- Publicar 1+ artículo/semana de forma consistente sin intervención manual en la generación
- Seguir automáticamente la estrategia SEO (keywords por prioridad)
- Generar contenido de calidad que no requiera reescritura completa

**Success Metrics:**
- Artículos generados sin errores: >90% de las ejecuciones del cron
- Tiempo de revisión por PR: <15 minutos
- Keywords de la estrategia cubiertas: progreso semanal constante

## Technical Architecture

### Overview del Flujo

```
Cron (GitHub Actions)
  → npx tsx seo/scripts/generate-weekly-post.ts
    → Lee contexto (usando Prompt Caching): brand-voice, keywords, estrategia
    → Selecciona siguiente keyword por prioridad (ALTA → MEDIA → BAJA)
    → Genera Outline (Estructura de H2/H3)
    → Genera contenido iterativamente por sección (~2000+ palabras)
    → Auto-validación (longitud, keyword density, links internos válidos)
    → Si falla validación → regenera sección/post (hasta 3 intentos)
    → Traduce/adapta a ES (llamada separada a la API)
    → Genera imagen cover via Nano Banana Pro API
  → Actualiza keywords-used.json
  → Crea PR con los archivos nuevos (incluyendo resumen en la descripción)
  → Notificación al autor (via GitHub)
```

### Estructura de Archivos Nuevos

```
seo/
├── context/
│   ├── brand-voice.md          # Tono, personalidad, estilo de escritura
│   ├── writing-examples.md     # Posts de referencia para imitar estilo
│   ├── target-keywords.json    # Keywords agrupadas por cluster con prioridad
│   ├── internal-links-map.md   # URLs existentes para interlinking
│   └── strategy-summary.md    # Resumen de la estrategia SEO (extraído de estrategia_seo_biolinq.md)
├── keywords-used.json          # Registro de keywords ya cubiertas
├── prompts/
│   ├── generate-post.md        # Prompt principal para generar artículo EN
│   ├── translate-post.md       # Prompt para traducir/adaptar EN → ES
│   └── generate-cover.md      # Prompt para generar la imagen de cover
└── scripts/
    ├── generate-weekly-post.ts # Orquestador principal (usa @anthropic-ai/sdk)
    └── validate-post.ts        # Validación de calidad (longitud, frontmatter, keyword density)
```

### GitHub Action Workflow

**Archivo:** `.github/workflows/seo-blog-post.yml`

**Trigger:** Cron configurable via variable de entorno (`SEO_CRON_SCHEDULE`), default: `0 8 * * 1` (lunes 8AM UTC).

**Pasos del workflow:**
1. Checkout del repo
2. Setup Node.js + instalar dependencias
3. Ejecutar script orquestador: `npx tsx seo/scripts/generate-weekly-post.ts`
   - Lee `seo/context/*` para contexto (aprovechando Prompt Caching de Anthropic)
   - Lee `seo/keywords-used.json` para saber qué keywords ya se usaron
   - Lee `seo/context/target-keywords.json` y selecciona la siguiente keyword por prioridad
   - Genera Outline y luego el post EN en `content/blog/en/<slug>.md`
   - Valida calidad (usando `validate-post.ts` internamente)
   - Si falla, regenera (hasta 3 intentos)
   - Traduce a ES en `content/blog/es/<slug>.md`
   - Llama a Nano Banana Pro API para generar cover image
   - Guarda imagen en `public/blog/covers/<slug>.webp`
   - Actualiza `seo/keywords-used.json`
4. Crear PR con `gh pr create` (inyectando un resumen de keyword, intent y extracto en el body del PR)

**Secrets necesarios:**
- `ANTHROPIC_API_KEY` — Para usar con `@anthropic-ai/sdk`
- `NANO_BANANA_PRO_API_KEY` — Para generación de imágenes

**Variables de entorno:**
- `SEO_CRON_SCHEDULE` — Expresión cron para la frecuencia

### Formato de `target-keywords.json`

```json
{
  "clusters": [
    {
      "name": "Velocidad & Performance",
      "keywords": [
        {
          "keyword": "fastest free biolink creator",
          "priority": "high",
          "volume": "280-420",
          "intent": "commercial",
          "suggestedSlug": "fastest-free-biolink-creator",
          "suggestedTitle": "The Fastest Free Biolink Creator in 2026",
          "cluster": "velocity"
        }
      ]
    }
  ]
}
```

### Formato de `keywords-used.json`

```json
{
  "used": [
    {
      "keyword": "what is a biolink page explained",
      "slug": "what-is-link-in-bio",
      "date": "2026-02-06",
      "cluster": "educational"
    }
  ]
}
```

### Formato de Posts Generados

Debe seguir exactamente el frontmatter Zod schema existente:

```yaml
---
title: "string"
slug: "string"
canonicalSlug: "string"
description: "string (max 160 chars)"
date: "YYYY-MM-DD"
author: "BioLinq Team"
tags: ["tag1", "tag2"]
coverImage: "/blog/covers/<slug>.webp"
coverAlt: "string"
readingTime: number
---
```

### Validación de Calidad (`validate-post.ts`)

Criterios de validación antes de crear el PR:
- **Longitud mínima:** 1500 palabras
- **Frontmatter válido:** Pasa el schema Zod existente en `blog-content.server.ts`
- **Keyword density:** La keyword principal aparece al menos 3 veces en el contenido
- **Keyword en H1/título:** Presente en el título
- **Description:** ≤160 caracteres
- **Slug válido:** Regex `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`
- **Internal links (ESTRICTO):** Todos los links internos generados DEBEN existir en `internal-links-map.md`. Si se detectan links inventados (alucinaciones), el script debe fallar o eliminar el link.
- **Imágenes:** coverImage path existe

Si falla → El script `generate-weekly-post.ts` regenera la sección o el artículo con feedback específico del error (hasta 3 intentos).

### Generación de Imágenes

- **API:** Nano Banana Pro
- **Input:** Título del artículo + tema/cluster como prompt
- **Output:** Imagen .webp guardada en `public/blog/covers/<slug>.webp`
- **Fallback:** Si la API falla, usar un placeholder genérico de BioLinq y marcar en el PR que necesita imagen manual

## Content Strategy Integration

El sistema debe seguir la estrategia definida en `estrategia_seo_biolinq.md`:

1. **Selección de keywords por prioridad:** ALTA (🔴) primero, luego MEDIA (🟡), luego BAJA (🟢)
2. **Dentro de la misma prioridad:** Seguir el orden de los clusters (Velocidad → Minimalismo → Pago Único → Alternativas → Casos de Uso → Educativo)
3. **Content pillars:** Respetar la estructura de pilares (posts largos de 2500+ para temas pilares, 1800+ para subtemas)
4. **Interlinking:** Cada nuevo post debe enlazar a posts existentes relevantes y a la home

## Security Considerations

- API keys almacenadas como GitHub Secrets, nunca en el repo
- El script TypeScript se ejecuta en un runner efímero de GitHub Actions
- Los PRs requieren revisión humana antes de merge (branch protection)
- `validate-post.ts` sanitiza contenido para prevenir inyección de scripts en markdown

## Testing Strategy

- **`validate-post.ts`:** Tests unitarios para cada criterio de validación
- **E2E existentes:** Los tests de blog existentes (`blog-post.spec.ts`, etc.) validan que los posts generados se renderizan correctamente
- **Dry-run manual:** Poder ejecutar el workflow manualmente (`workflow_dispatch`) para probar sin esperar al cron

## Risks & Mitigations

| Riesgo | Mitigación |
|--------|-----------|
| Fallo en la llamada a la API de Anthropic | Retry logic + manejo de timeouts en el script + notificación vía GitHub Actions |
| Contenido de baja calidad o "AI Fluff" | Generación iterativa por secciones + Validación automática + regeneración + revisión humana en PR |
| Fallo en Prompt Caching | El script debe manejar la carga completa del contexto si el caché expira |
| Alucinaciones en Interlinking | Validación estricta contra `internal-links-map.md`. Link inválido = link eliminado o regeneración |
| Nano Banana Pro API down | Fallback a placeholder genérico en el script |
| Keyword duplicada | `keywords-used.json` como source of truth |
| Costes de API inesperados | 1 ejecución/semana = ~4/mes, controlado. Uso de Prompt Caching |

## Open Questions

1. ¿Cuál es el endpoint exacto y formato de request/response de Nano Banana Pro? (Se implementará en una función dedicada dentro del script)
2. *Resuelto:* El PR incluirá un preview/resumen del artículo en la descripción usando `gh pr create --body`.
3. *Resuelto:* Notificación vía GitHub Actions es suficiente para la v1.
