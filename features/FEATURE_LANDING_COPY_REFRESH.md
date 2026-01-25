# FEATURE_LANDING_COPY_REFRESH.md

## ✅ IMPLEMENTATION STATUS: 100% COMPLETE

**Verificado en producción: Sin fallos ✅**

---

## 1. Natural Language Description

### Estado Actual
La landing page de BioLinq tiene:
- **Hero**: Título "Less is more." + tagline + formulario de claim username + 3 value props
- **Pricing**: Sección con 2 tarjetas (Free/Premium) y features comparativas
- **Footer**: Links legales y copyright

El copy actual es funcional pero no agresivo. No ataca los puntos de dolor de la competencia ni presenta una comparativa directa.

### Estado Final Esperado
La landing page tendrá una estructura más persuasiva con copywriting enfocado en dolor → solución → comparativa:

1. **Hero renovado**:
   - Nuevo headline agresivo: "Tu presencia online no debería ser una factura mensual"
   - Subheadline con propuesta de valor clara
   - Formulario de claim (se mantiene)
   - **Video promo integrado** (archivo `out/promo.mp4`)

2. **Sección "El Problema"** (NUEVA):
   - Agita el dolor del usuario sobre la competencia
   - Lista de problemas: suscripciones, lentitud, exceso de features

3. **Sección "La Solución"** (NUEVA):
   - Presenta BioLinq como respuesta a los problemas
   - 4 value props renovadas: velocidad, privacidad, diseño, analytics

4. **Sección Comparativa** (NUEVA):
   - Tabla "Otros vs BioLinq"
   - Comparación directa: precio, velocidad, setup, propiedad

5. **Sección Growth Loop / Prueba Social** (NUEVA):
   - Quote testimonial
   - Score de velocidad real (PageSpeed)

6. **Pricing** (se mantiene estructura, se actualiza copy):
   - Mismas 2 tarjetas
   - Features actualizadas

7. **CTA Final** (NUEVO):
   - Llamada a la acción final con urgencia
   - Botón para reclamar username

---

## 2. Technical Description

### Enfoque
- **Mantener diseño neo-brutal existente** - solo cambios de copy y estructura
- **Crear nuevas secciones como componentes independientes** en `app/components/landing/`
- **Reutilizar componentes existentes** donde sea posible (NeoBrutalCard, NeoBrutalButton, etc.)
- **Integrar video promo** moviendo `out/promo.mp4` a `public/` y usando tag `<video>`
- **I18N completo** - todos los textos nuevos en ambos idiomas (en/es)

### Arquitectura
- **Route module (`home.tsx`)**: Composición mínima de secciones
- **Componentes landing**: Cada sección es un componente puro
- **Sin lógica de negocio en componentes**: Todo el estado del claim sigue en `useUsernameClaim`

### Flujo de la página
```
Header
  ↓
HeroSection (renovado + video)
  ↓
ProblemSection (NUEVO)
  ↓
SolutionSection (NUEVO)
  ↓
ComparisonSection (NUEVO)
  ↓
SocialProofSection (NUEVO)
  ↓
PricingSection (existente, copy actualizado)
  ↓
FinalCTASection (NUEVO)
  ↓
Footer
```

---

## 2.1. Architecture Gate

- **Pages are puzzles:** `home.tsx` solo compone secciones, sin UI propia
- **Loaders/actions are thin:** El loader existente ya es thin (detecta dominio, sesión, redirect)
- **Business logic is not in components:**
  - La lógica de claim username permanece en `useUsernameClaim` hook
  - Los componentes de sección son puramente presentacionales

### Para cada route module:
- `home.tsx`: Compone `BioLinqHero`, `ProblemSection`, `SolutionSection`, `ComparisonSection`, `SocialProofSection`, `PricingSection`, `FinalCTASection`

### Para cada componente:
- `BioLinqHero`: Usa `useUsernameClaim` hook, sin lógica de negocio propia
- Nuevas secciones: Sin hooks, solo props y traducción

---

## 3. Files to Change/Create

### `public/promo.mp4`
**Objective:** Mover el video promo a la carpeta pública para servirlo

**Pseudocode:**
```pseudocode
COPY out/promo.mp4 → public/promo.mp4
```

---

### `app/components/landing/BioLinqHero.tsx`
**Objective:** Actualizar Hero con nuevo copy y video promo integrado

**Pseudocode:**
```pseudocode
COMPONENT BioLinqHero
  PROPS: initialError?: string

  HOOKS:
    - useTranslation() para textos
    - useUsernameClaim() para lógica de claim

  RENDER:
    - Container max-w-4xl con grid 2 columnas en desktop

    LEFT COLUMN (texto + form):
      - H1: t('hero_headline') - "Tu presencia online..."
      - Subheadline: t('hero_subheadline') - "Crea una página..."
      - NeoBrutalCard con:
        - NeoBrutalInput prefix="biolinq.page/"
        - Error display
        - NeoBrutalButton variant="accent"
        - Pricing note

    RIGHT COLUMN (video):
      - Video element con:
        - src="/promo.mp4"
        - autoplay, muted, loop, playsinline
        - Neo-brutal border styling
        - Poster opcional

    MOBILE: Stack vertical (form primero, video después)
END
```

---

### `app/components/landing/ProblemSection.tsx` (NUEVO)
**Objective:** Sección que agita el dolor del usuario sobre la competencia

**Pseudocode:**
```pseudocode
COMPONENT ProblemSection
  PROPS: none (solo traducción)

  HOOKS:
    - useTranslation()

  RENDER:
    - Section con bg-neo-panel
    - Container max-w-4xl

    TITLE: t('problem_title') - "¿Por qué seguir pagando..."

    GRID 3 columnas (1 en mobile):
      CARD 1:
        - Icon: 💸
        - Title: t('problem_subscriptions_title')
        - Desc: t('problem_subscriptions_desc')

      CARD 2:
        - Icon: 🐌
        - Title: t('problem_speed_title')
        - Desc: t('problem_speed_desc')

      CARD 3:
        - Icon: 🔊
        - Title: t('problem_noise_title')
        - Desc: t('problem_noise_desc')
END
```

---

### `app/components/landing/SolutionSection.tsx` (NUEVO)
**Objective:** Presentar BioLinq como la solución a los problemas

**Pseudocode:**
```pseudocode
COMPONENT SolutionSection
  PROPS: none

  HOOKS:
    - useTranslation()

  RENDER:
    - Section con bg-neo-canvas
    - Container max-w-4xl

    HEADER:
      - Badge: "LA SOLUCIÓN"
      - Title: t('solution_title') - "BioLinq: El estándar minimalista"
      - Subtitle: t('solution_subtitle')

    GRID 2x2 (stack en mobile):
      CARD 1: Velocidad bruta
        - Icon: ⚡
        - Title: t('solution_speed_title')
        - Desc: t('solution_speed_desc')
        - Highlight: "<500ms"

      CARD 2: Privacidad por diseño
        - Icon: 🔒
        - Title: t('solution_privacy_title')
        - Desc: t('solution_privacy_desc')

      CARD 3: Diseño Profesional
        - Icon: 🎨
        - Title: t('solution_design_title')
        - Desc: t('solution_design_desc')

      CARD 4: Smart Link Analytics
        - Icon: 📊
        - Title: t('solution_analytics_title')
        - Desc: t('solution_analytics_desc')
        - Badge: "PREMIUM"
END
```

---

### `app/components/landing/ComparisonSection.tsx` (NUEVO)
**Objective:** Tabla comparativa "Otros vs BioLinq"

**Pseudocode:**
```pseudocode
COMPONENT ComparisonSection
  PROPS: none

  HOOKS:
    - useTranslation()

  RENDER:
    - Section con bg-white
    - Container max-w-3xl

    TITLE: t('comparison_title') - "El Adiós a la Suscripción"

    TABLE neo-brutal (border 3px, shadow):
      HEADER ROW:
        - Feature | Otros (Suscripción) | BioLinq (Lifetime)

      ROWS:
        - Precio: "60€ - 280€ al año" vs "5€ una sola vez" (highlight)
        - Velocidad: "Lenta (scripts)" vs "Ultra-rápida ⚡" (highlight)
        - Setup: "Complejo y tedioso" vs "Listo en 2 minutos" (highlight)
        - Propiedad: "Alquilas tu espacio" vs "Es tuyo para siempre" (highlight)

    STYLING:
      - Columna BioLinq con bg-neo-primary/20
      - Checks verdes para BioLinq
      - X rojas para competencia
END
```

---

### `app/components/landing/SocialProofSection.tsx` (NUEVO)
**Objective:** Prueba social con quote y score de velocidad

**Pseudocode:**
```pseudocode
COMPONENT SocialProofSection
  PROPS: none

  HOOKS:
    - useTranslation()

  RENDER:
    - Section con bg-neo-canvas
    - Container max-w-3xl centered

    QUOTE BLOCK:
      - Comillas decorativas (")
      - Text: t('social_quote')
      - Attribution: "— Creador de contenido"

    SPEED SCORE:
      - Title: "⚡ Score de Velocidad Real:"
      - Large number: "99/100"
      - Subtitle: "Google PageSpeed Insights"
      - Small text: t('social_speed_note')
END
```

---

### `app/components/landing/FinalCTASection.tsx` (NUEVO)
**Objective:** Llamada a la acción final

**Pseudocode:**
```pseudocode
COMPONENT FinalCTASection
  PROPS: none

  HOOKS:
    - useTranslation()

  RENDER:
    - Section con bg-neo-primary
    - Container max-w-2xl centered

    CONTENT:
      - Title: t('final_cta_title') - "¿Listo para simplificar tu bio?"
      - Subtitle: t('final_cta_subtitle')

      CTA BUTTON (link to top):
        - Text: t('final_cta_button') - "Reclamar mi biolinq.page/tu-nombre"
        - Variant: dark (contraste con bg primary)
        - onClick: scroll to hero form

      URGENCY NOTE:
        - Text: t('final_cta_note') - "Solo 5€ por acceso Premium..."
END
```

---

### `app/components/landing/PricingSection.tsx`
**Objective:** Actualizar copy de la sección de precios existente

**Pseudocode:**
```pseudocode
COMPONENT PricingSection (UPDATE)

  CHANGES:
    - Title: t('pricing_title') → mantener
    - Subtitle: NUEVO → t('pricing_new_subtitle')

    FREE CARD:
      - Features actualizadas con nuevos textos

    PREMIUM CARD:
      - Price note: t('pricing_premium_lifetime_note')
      - Features con nuevo copy enfatizando valor
END
```

---

### `app/components/landing/index.ts`
**Objective:** Exportar los nuevos componentes

**Pseudocode:**
```pseudocode
EXPORT:
  - BioLinqHero (existente)
  - ProblemSection (nuevo)
  - SolutionSection (nuevo)
  - ComparisonSection (nuevo)
  - SocialProofSection (nuevo)
  - PricingSection (existente)
  - FinalCTASection (nuevo)
  - ... otros existentes
END
```

---

### `app/routes/home.tsx`
**Objective:** Componer las nuevas secciones en el orden correcto

**Pseudocode:**
```pseudocode
ROUTE home.tsx

LOADER (sin cambios):
  - Detecta custom domain
  - Detecta sesión
  - Redirect si tiene biolink

COMPONENT:
  IF custom domain → PublicProfile
  ELSE:
    RENDER:
      <BioLinqHero initialError={error} />
      <ProblemSection />
      <SolutionSection />
      <ComparisonSection />
      <SocialProofSection />
      <PricingSection />
      <FinalCTASection />
END
```

---

### `app/locales/en.json`
**Objective:** Añadir todas las nuevas keys de traducción en inglés

---

### `app/locales/es.json`
**Objective:** Añadir todas las nuevas keys de traducción en español

---

## 4. I18N

### Existing keys to reuse
- `hero_cta` - Para el botón del formulario
- `username_*` - Para validación y estados
- `pricing_*` - Para sección de precios (algunos)
- `footer_*` - Para footer

### New keys to create

| Key | English | Spanish |
|-----|---------|---------|
| **Hero** | | |
| `hero_headline` | Your online presence shouldn't be a monthly bill. | Tu presencia online no debería ser una factura mensual. |
| `hero_subheadline` | Create an ultra-fast link page (⚡) with professional design and **a single €5 lifetime payment**. | Crea una página de links ultra-rápida (⚡) con diseño profesional y **un único pago de 5€ de por vida**. |
| `hero_setup_note` | Setup in less than 2 minutes | Configuración en menos de 2 minutos |
| **Problem Section** | | |
| `problem_title` | Why keep paying for a "Link Menu"? | ¿Por qué seguir pagando por un "Menú de links"? |
| `problem_subtitle` | Current tools have become slow and expensive: | Las herramientas actuales se han vuelto lentas y costosas: |
| `problem_subscriptions_title` | Endless subscriptions | Suscripciones infinitas |
| `problem_subscriptions_desc` | Paying up to €24/month for a link list is excessive. | Pagar hasta 24€/mes por una lista de enlaces es excesivo. |
| `problem_speed_title` | Heavy load times | Carga pesada |
| `problem_speed_desc` | Your followers leave if your page takes more than 2 seconds to load. | Tus seguidores abandonan si tu página tarda más de 2 segundos en abrirse. |
| `problem_noise_title` | Too much noise | Exceso de ruido |
| `problem_noise_desc` | Features you don't use that only distract your audience. | Features que no usas y que solo distraen a tu audiencia. |
| **Solution Section** | | |
| `solution_badge` | THE SOLUTION | LA SOLUCIÓN |
| `solution_title` | BioLinq: The minimalist standard | BioLinq: El estándar minimalista |
| `solution_subtitle` | We've eliminated the noise to give you what really matters. | Hemos eliminado el ruido para darte lo que realmente importa. |
| `solution_speed_title` | Raw Speed | Velocidad bruta |
| `solution_speed_desc` | Optimized to load in less than 500ms. Every millisecond gained is a follower not lost. | Optimizada para cargar en menos de 500ms. Cada milisegundo ganado es un seguidor que no se pierde. |
| `solution_privacy_title` | Privacy by Design | Privacidad por diseño |
| `solution_privacy_desc` | No third-party cookies or intrusive tracking. We respect your audience as much as you do. | Sin cookies de terceros ni rastreo intrusivo. Respetamos a tu audiencia tanto como tú. |
| `solution_design_title` | Professional Design (Zero Bloat) | Diseño Profesional (Zero Bloat) |
| `solution_design_desc` | Choose from 4 brutal themes designed to convert clicks, not to show off the platform. | Elige entre 4 temas brutales diseñados para convertir clics, no para presumir de plataforma. |
| `solution_analytics_title` | Smart Link Analytics | Smart Link Analytics |
| `solution_analytics_desc` | In the Premium version, discover where your visits come from and which links perform best. | En la versión Premium, descubre de dónde vienen tus visitas y qué links funcionan mejor. |
| **Comparison Section** | | |
| `comparison_title` | The Goodbye to Subscriptions | El Adiós a la Suscripción |
| `comparison_feature` | Feature | Feature |
| `comparison_others` | Others (Subscription) | Otros (Suscripción) |
| `comparison_biolinq` | BioLinq (Lifetime) | BioLinq (Lifetime) |
| `comparison_price_label` | Price | Precio |
| `comparison_price_others` | €60 - €280 per year | 60€ - 280€ al año |
| `comparison_price_biolinq` | €5 one time only | 5€ una sola vez |
| `comparison_speed_label` | Speed | Velocidad |
| `comparison_speed_others` | Slow (full of scripts) | Lenta (llena de scripts) |
| `comparison_speed_biolinq` | Ultra-fast (⚡) | Ultra-rápida (⚡) |
| `comparison_setup_label` | Setup | Setup |
| `comparison_setup_others` | Complex and tedious | Complejo y tedioso |
| `comparison_setup_biolinq` | Ready in 2 minutes | Listo en 2 minutos |
| `comparison_ownership_label` | Ownership | Propiedad |
| `comparison_ownership_others` | You rent your space | Alquilas tu espacio |
| `comparison_ownership_biolinq` | It's yours forever | Es tuyo para siempre |
| **Social Proof Section** | | |
| `social_quote` | "BioLinq is for those of us who prefer to spend our time creating content, not configuring complex tools." | "BioLinq es para los que preferimos dedicar nuestro tiempo a crear contenido, no a configurar herramientas complejas." |
| `social_quote_attribution` | — Content creator | — Creador de contenido |
| `social_speed_title` | ⚡ Real Speed Score: | ⚡ Score de Velocidad Real: |
| `social_speed_score` | 99/100 | 99/100 |
| `social_speed_source` | Google PageSpeed Insights | Google PageSpeed Insights |
| `social_speed_note` | It's not magic, it's minimalist engineering. | No es magia, es ingeniería minimalista. |
| **Final CTA Section** | | |
| `final_cta_title` | Ready to simplify your bio? | ¿Listo para simplificar tu bio? |
| `final_cta_subtitle` | Join the creators who have already left behind unnecessary subscriptions. | Únete a los creadores que ya han dejado atrás las suscripciones innecesarias. |
| `final_cta_button` | Claim my biolinq.page | Reclamar mi biolinq.page |
| `final_cta_note` | Only €5 for lifetime Premium access. Limited launch offer. | Solo 5€ por acceso Premium de por vida. Oferta limitada de lanzamiento. |

---

## 5. E2E Test Plan

### Test: Landing page renders all new sections
- **Preconditions:** User is not logged in
- **Steps:**
  1. Navigate to `/`
  2. Scroll down the page
- **Expected:**
  - Hero section visible with new headline
  - Problem section visible with 3 cards
  - Solution section visible with 4 value props
  - Comparison table visible
  - Social proof section visible
  - Pricing section visible
  - Final CTA section visible

### Test: Video promo autoplays in hero
- **Preconditions:** User is on landing page
- **Steps:**
  1. Navigate to `/`
  2. Observe hero section
- **Expected:**
  - Video element is present
  - Video is playing (muted autoplay)
  - Video has neo-brutal border styling

### Test: Username claim flow still works
- **Preconditions:** User is not logged in
- **Steps:**
  1. Navigate to `/`
  2. Enter a valid username in the hero form
  3. Click CTA button
- **Expected:**
  - Form validates input
  - Redirects to Google auth (existing behavior preserved)

### Test: Final CTA scrolls to hero form
- **Preconditions:** User is on landing page
- **Steps:**
  1. Scroll to bottom of page
  2. Click "Claim my biolinq.page" button
- **Expected:**
  - Page scrolls smoothly to hero form
  - Form input is focused

### Test: Comparison table renders correctly on mobile
- **Preconditions:** Mobile viewport (375px)
- **Steps:**
  1. Navigate to `/`
  2. Scroll to comparison section
- **Expected:**
  - Table is readable without horizontal scroll
  - All rows visible
  - BioLinq column highlighted

### Test: I18N works for all new sections
- **Preconditions:** Browser set to Spanish
- **Steps:**
  1. Navigate to `/`
  2. Verify Spanish translations appear
- **Expected:**
  - All section titles in Spanish
  - All descriptions in Spanish
  - No missing translation keys shown

---

## 6. Implementation Order

1. **Move video file** to `public/promo.mp4`
2. **Add I18N keys** to both locale files
3. **Create new components** (in order):
   - `ProblemSection.tsx`
   - `SolutionSection.tsx`
   - `ComparisonSection.tsx`
   - `SocialProofSection.tsx`
   - `FinalCTASection.tsx`
4. **Update `BioLinqHero.tsx`** with new copy and video
5. **Update `PricingSection.tsx`** with refreshed copy
6. **Update `index.ts`** exports
7. **Update `home.tsx`** to compose all sections
8. **Run tests and verify**

---

## 7. Notes

- El video `out/promo.mp4` (1.7MB) es suficientemente pequeño para autoplay
- Mantener `muted` y `playsinline` para autoplay en iOS
- Considerar añadir `poster` con un frame del video para carga inicial
- La tabla comparativa puede necesitar scroll horizontal en móviles muy pequeños - evaluar si usar cards en lugar de tabla para mobile
