# PRD: BioLinq.page

> **"Less is more. Diferénciate siendo simple cuando todos compiten por features."**

---

## 1. Resumen Ejecutivo

| Aspecto | Detalle |
|---------|---------|
| **Producto** | BioLinq.page — El Linktree minimalista |
| **Propuesta de valor** | Una página de links ultra-rápida (<500ms) con la mínima fricción |
| **Modelo de negocio** | Freemium + 5€ lifetime premium |
| **Esfuerzo estimado** | 4-5 días (Esfuerzo Medio) |
| **Stack** | TypeScript, React Router, Neon (PostgreSQL), Netlify |
| **SEO Potencial** | ⭐⭐⭐ |

---

## 2. El Problema

### Dolor del Usuario

Los creadores de contenido, freelancers y profesionales necesitan una página simple para centralizar sus links (Instagram, portfolio, contacto, etc.). Las soluciones actuales:

- **Linktree:** Sobrecargado de features innecesarias, planes caros ($5-24/mes)
- **Alternativas:** O son igual de complejas o carecen de diseño profesional
- **DIY:** Crear tu propia página requiere hosting, dominio, mantenimiento

### La Oportunidad

El 80% de usuarios solo necesitan:
- 5 links o menos
- Un diseño que no avergüence
- Que cargue rápido
- Saber cuántos clicks reciben

**BioLink.page entrega exactamente eso. Nada más.**

---

## 3. La Solución

### Propuesta de Valor

```
biolinq.page/username
├── Carga en <500ms
├── 4 temas profesionales
├── Hasta 5 links con emoji + título
├── Analytics básicas (visitas + clicks)
└── 5€ lifetime para desbloquear todo
```

### Diferenciación vs Competencia

| Feature | Linktree Free | BioLinq Free | BioLinq Premium (5€) |
|---------|---------------|--------------|----------------------|
| Links | Ilimitados | Hasta 5 | Hasta 5 |
| Temas | 1 | 4 (limitados) | 4 + colores custom |
| Analytics | Solo visitas | Solo visitas totales | Clicks por link + histórico 30 días |
| Branding | Siempre | Watermark | Sin watermark |
| Precio | $0 | $0 | 5€ una vez |

---

## 4. Usuarios Objetivo

### Persona Principal: El Creador Minimalista

> "Solo quiero algo que funcione. No necesito 50 integraciones."

- **Quién:** Creadores de contenido pequeños/medianos, freelancers, profesionales
- **Frustración:** Las herramientas existentes son overkill para sus necesidades
- **Motivación:** Tener presencia profesional con mínimo esfuerzo
- **Comportamiento:** Configura una vez, lo olvida, revisa stats ocasionalmente

### Jobs to Be Done

1. **Cuando** comparto mi perfil en redes → **Quiero** un único link profesional → **Para** no abrumar con múltiples URLs
2. **Cuando** configuro mi bio → **Quiero** que tome menos de 2 minutos → **Para** volver a lo que realmente importa
3. **Cuando** reviso mi perfil → **Quiero** ver qué links funcionan → **Para** optimizar mi presencia

---

## 5. Funcionalidades del MVP

### 5.1 Autenticación

| Aspecto | Especificación |
|---------|----------------|
| **Método** | OAuth con Google (único método) |
| **Datos capturados** | Email, nombre, avatar |
| **Sesión** | Persistente (cookie/JWT) |

**Flujo:**
```
Landing → "Crear mi BioLink" → OAuth Google → Dashboard
```

### 5.2 Registro de Username

| Aspecto | Especificación |
|---------|----------------|
| **Formato** | `biolinq.page/username` |
| **Longitud** | 3-20 caracteres |
| **Caracteres** | Alfanuméricos + guiones (no al inicio/final) |
| **Validación** | Lowercase, único, sin palabras reservadas |
| **Límite** | 1 biolinq por cuenta |
| **Edición** | No permitida en MVP (solo borrar cuenta) |

**Palabras reservadas:** `admin`, `api`, `www`, `app`, `dashboard`, `login`, `signup`, `settings`, `premium`, `help`, `support`, `terms`, `privacy`

**Flujo post-registro:**
```
Primer login → Modal "Elige tu username" → Validación en tiempo real → Confirmar
```

### 5.3 Editor de Links

| Aspecto | Especificación |
|---------|----------------|
| **Máximo** | 5 links |
| **Campos por link** | Emoji (opcional) + Título + URL |
| **Emoji** | Selector nativo del OS o emoji picker simple |
| **Título** | Máx 50 caracteres |
| **URL** | Validación de formato, debe incluir protocolo |
| **Orden** | Drag & drop |
| **Guardado** | Auto-save con debounce (500ms) |

**UI del Editor:**
```
┌─────────────────────────────────────────────┐
│  ≡  🐦  Twitter                    [🗑️]    │
│      https://twitter.com/username           │
├─────────────────────────────────────────────┤
│  ≡  📧  Contacto                   [🗑️]    │
│      mailto:me@email.com                    │
├─────────────────────────────────────────────┤
│  ≡  🌐  Mi Portfolio               [🗑️]    │
│      https://miportfolio.com                │
├─────────────────────────────────────────────┤
│           [+ Añadir link]                   │
│              (2/5 restantes)                │
└─────────────────────────────────────────────┘
```

### 5.4 Selector de Tema

| Tema | Descripción |
|------|-------------|
| **Brutalist** | Fondo blanco, bordes negros gruesos, tipografía bold |
| **Light Minimal** | Fondo claro, sombras sutiles, tipografía sans-serif limpia |
| **Dark Mode** | Fondo oscuro (#121212), texto claro, acentos en gris |
| **Colorful** | Gradientes suaves, colores vibrantes pero armónicos |

**Personalización:**

| Usuario | Opciones |
|---------|----------|
| **Free** | Elegir entre 4 temas predefinidos |
| **Premium** | Temas + Color primario custom + Color de fondo custom |

### 5.5 Página Pública del BioLink

**URL:** `https://biolinq.page/username`

**Estructura:**
```
┌─────────────────────────────────────────────┐
│                                             │
│              [Avatar]                       │
│              Nombre                         │
│                                             │
│     ┌─────────────────────────────────┐     │
│     │  🐦  Twitter                    │     │
│     └─────────────────────────────────┘     │
│                                             │
│     ┌─────────────────────────────────┐     │
│     │  📧  Contacto                   │     │
│     └─────────────────────────────────┘     │
│                                             │
│     ┌─────────────────────────────────┐     │
│     │  🌐  Mi Portfolio               │     │
│     └─────────────────────────────────┘     │
│                                             │
│         Made with BioLink.page ←(watermark) │
│                                             │
└─────────────────────────────────────────────┘
```

**Requisitos de Performance:**
- **LCP:** < 500ms
- **CLS:** 0
- **FID:** < 100ms
- Sin JavaScript innecesario en la página pública
- Imágenes optimizadas (avatar servido desde CDN con resize)

### 5.6 Analytics

**Métricas trackeadas:**

| Métrica | Free | Premium |
|---------|------|---------|
| Visitas totales (lifetime) | ✅ | ✅ |
| Clicks totales (lifetime) | ❌ | ✅ |
| Clicks por link | ❌ | ✅ |
| Histórico últimos 30 días | ❌ | ✅ |

**Implementación:**
- Visita = Pageview único (no contar recargas, usar cookie de sesión)
- Click = Redirect a través de `/go/{linkId}` para trackear
- Almacenamiento: Agregados diarios en DB, no eventos raw

**Dashboard de Stats (Free):**
```
┌─────────────────────────────────────────────┐
│  📊 Estadísticas                            │
│                                             │
│  Visitas totales: 1,234                     │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  🔒 Desbloquea clicks por link      │    │
│  │     y histórico de 30 días          │    │
│  │                                     │    │
│  │     [Hacerme Premium - 5€]          │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

**Dashboard de Stats (Premium):**
```
┌─────────────────────────────────────────────┐
│  📊 Estadísticas                            │
│                                             │
│  Visitas: 1,234    Clicks: 567              │
│                                             │
│  [Gráfico de línea - últimos 30 días]       │
│                                             │
│  Clicks por link:                           │
│  🐦 Twitter ████████████ 234 (41%)          │
│  📧 Contacto ██████ 123 (22%)               │
│  🌐 Portfolio ████████ 210 (37%)            │
└─────────────────────────────────────────────┘
```

### 5.7 Panel de Usuario / Perfil

**Secciones:**

1. **Mi BioLink** — Editor de links + preview
2. **Estadísticas** — Dashboard de analytics
3. **Mi Cuenta:**
   - Email (readonly, de Google)
   - Nombre (readonly, de Google)
   - Avatar (readonly, de Google)
   - Estado: Free / Premium
   - Botón: "Hacerme Premium" (si Free) o Badge "✨ Premium"
   - Botón: "Borrar mi cuenta" (con confirmación doble)

### 5.8 Upgrade a Premium

**Flujo:**
```
Click "Hacerme Premium" → Stripe Checkout → Callback success → Actualizar DB → Redirect dashboard
```

**Stripe:**
- Producto: "BioLinq Premium"
- Precio: 5€ (pago único, lifetime)
- No suscripción, no renovación

**Post-pago:**
- Acceso inmediato a:
  - Analytics completas
  - Personalización de colores
  - Sin watermark

### 5.9 Borrar Cuenta

**Flujo:**
```
Click "Borrar cuenta" → Modal confirmación → Escribir username para confirmar → Borrado
```

**Qué se borra:**
- Usuario
- BioLink
- Links
- Stats
- El username queda liberado

**Qué NO se borra:**
- Registro de pago en Stripe (por temas legales/fiscales)

---

## 6. Arquitectura Técnica

### 6.1 Stack

| Capa | Tecnología |
|------|------------|
| **Frontend** | React + React Router |
| **Styling** | Tailwind CSS |
| **Backend** | React Router (loaders/actions) + API routes |
| **Database** | Neon (PostgreSQL) |
| **Auth** | Google OAuth (lucia-auth o similar) |
| **Pagos** | Stripe Checkout |
| **Hosting** | Netlify |
| **Analytics** | Custom (no third-party para mantener simplicidad) |

### 6.2 Modelo de Datos

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- BioLinks (1:1 con User)
CREATE TABLE biolinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(20) UNIQUE NOT NULL,
  theme VARCHAR(20) DEFAULT 'light_minimal',
  custom_primary_color VARCHAR(7),  -- #RRGGBB, solo premium
  custom_bg_color VARCHAR(7),       -- #RRGGBB, solo premium
  total_views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Links
CREATE TABLE links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  biolink_id UUID REFERENCES biolinks(id) ON DELETE CASCADE,
  emoji VARCHAR(10),
  title VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  position INTEGER NOT NULL,
  total_clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Daily Stats (para histórico de 30 días)
CREATE TABLE daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  biolink_id UUID REFERENCES biolinks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  UNIQUE(biolink_id, date)
);

-- Click Events (para clicks por link, agregado diario)
CREATE TABLE daily_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID REFERENCES links(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  clicks INTEGER DEFAULT 0,
  UNIQUE(link_id, date)
);

-- Indexes
CREATE INDEX idx_biolinks_username ON biolinks(username);
CREATE INDEX idx_daily_stats_biolink_date ON daily_stats(biolink_id, date);
CREATE INDEX idx_daily_link_clicks_link_date ON daily_link_clicks(link_id, date);
```

### 6.3 Rutas

| Ruta | Tipo | Descripción |
|------|------|-------------|
| `/` | Pública | Landing page |
| `/login` | Pública | Redirect a Google OAuth |
| `/auth/callback` | Pública | Callback de OAuth |
| `/dashboard` | Protegida | Panel principal (editor + stats) |
| `/dashboard/account` | Protegida | Configuración de cuenta |
| `/dashboard/upgrade` | Protegida | Página pre-Stripe |
| `/api/stripe/checkout` | API | Crear sesión de Stripe |
| `/api/stripe/webhook` | API | Webhook de Stripe |
| `/go/:linkId` | Pública | Redirect + tracking de clicks |
| `/:username` | Pública | Página del BioLinq |

### 6.4 Performance Strategy

**Página pública (`/:username`):**
- SSR/ISR para máxima velocidad
- HTML mínimo, CSS inline critical
- Sin JS excepto para tracking de analytics (defer)
- Avatar servido desde URL de Google (ya optimizada) o placeholder

**Dashboard:**
- Client-side rendering normal
- Lazy loading de charts

---

## 7. Watermark

**Versión Free:**
```html
<a href="https://biolinq.page" target="_blank" rel="noopener">
  Made with BioLinq.page
</a>
```

- Posición: Footer de la página pública
- Estilo: Sutil, mismo color que texto secundario del tema
- Link: Lleva a landing (growth loop)

**Versión Premium:**
- Sin watermark

---

## 8. Validaciones y Edge Cases

### Username

| Caso | Comportamiento |
|------|----------------|
| Ya existe | "Este username no está disponible" |
| < 3 caracteres | "Mínimo 3 caracteres" |
| > 20 caracteres | "Máximo 20 caracteres" |
| Caracteres inválidos | "Solo letras, números y guiones" |
| Guión al inicio/final | "No puede empezar ni terminar con guión" |
| Palabra reservada | "Este username está reservado" |

### Links

| Caso | Comportamiento |
|------|----------------|
| URL sin protocolo | Auto-prepend `https://` |
| URL inválida | "Introduce una URL válida" |
| Título vacío | "El título es obligatorio" |
| > 5 links | Botón "Añadir" deshabilitado |

### Cuenta

| Caso | Comportamiento |
|------|----------------|
| Usuario borra cuenta | Confirmación con escribir username |
| Usuario premium borra cuenta | Mismo flujo (no hay reembolso, lifetime ya usado) |

---

## 9. Métricas de Éxito

### KPIs del Producto

| Métrica | Objetivo (3 meses) |
|---------|-------------------|
| BioLinqs creados | 500 |
| Conversión Free → Premium | 5% |
| Ingresos | 125€ (25 × 5€) |
| Tiempo medio de setup | < 2 minutos |
| Bounce rate landing | < 60% |

### Métricas Técnicas

| Métrica | Objetivo |
|---------|----------|
| LCP página pública | < 500ms |
| Uptime | 99.9% |
| Error rate | < 0.1% |

---

## 10. Fuera del Alcance (MVP)

Explícitamente **NO** incluimos en el MVP:

- ❌ Cambiar username después de crearlo
- ❌ Múltiples biolinqs por cuenta
- ❌ Custom domains (ej: links.midominio.com)
- ❌ Integraciones (Spotify, YouTube embeds)
- ❌ Themes custom (solo colores en premium)
- ❌ Animaciones en links
- ❌ QR code generator
- ❌ Social login con otros providers (solo Google)
- ❌ API pública
- ❌ Modo colaborativo / equipos
- ❌ Scheduling de links
- ❌ A/B testing de links

---

## 11. Roadmap Post-MVP

### v1.1 — Quick Wins (semana 2)
- [ ] Cambiar username (una vez, con cooldown de 30 días)
- [ ] Export de datos (JSON)
- [ ] QR code de tu biolinq

### v1.2 — Growth (mes 1)
- [ ] SEO landing pages ("biolinq para músicos", "biolinq para artistas")
- [ ] Referral program (invita amigo → ambos premium)
- [ ] Integración con Telegram/WhatsApp share

### v2.0 — Expansion (mes 3)
- [ ] Custom domains
- [ ] Más temas premium
- [ ] API pública (para integraciones)

---

## 12. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Abuso (spam links) | Media | Alto | Rate limiting, report button, moderation manual |
| Username squatting | Media | Bajo | Sin impacto si no hay mercado secundario |
| Competencia copia | Alta | Bajo | Velocidad de ejecución, marca |
| Stripe fees comen margen | Alta | Medio | 5€ - ~0.55€ fees = 4.45€ margen suficiente |

---

## 13. Checklist Pre-Desarrollo

- [ ] Configurar proyecto con template existente
- [ ] Crear proyecto en Neon
- [ ] Configurar Google OAuth credentials
- [ ] Crear cuenta Stripe + producto "BioLink Premium"
- [ ] Configurar Netlify project
- [ ] Reservar dominio biolinq.page (o alternativa)
- [ ] Definir los 4 temas exactos (colores, tipografías)

---

## 14. Definition of Done

El MVP está completo cuando:

- [ ] Usuario puede registrarse con Google
- [ ] Usuario puede elegir username único
- [ ] Usuario puede crear/editar/ordenar hasta 5 links
- [ ] Usuario puede elegir entre 4 temas
- [ ] Página pública carga en < 500ms
- [ ] Analytics de visitas funcionando (free)
- [ ] Usuario puede pagar 5€ via Stripe
- [ ] Post-pago: analytics completas + colores custom + sin watermark
- [ ] Usuario puede borrar su cuenta
- [ ] Tests E2E del happy path
- [ ] Deployed en producción

---

*PRD generado con 🧠 ultrathink methodology*
*Versión: 1.0*
*Fecha: Enero 2026*
