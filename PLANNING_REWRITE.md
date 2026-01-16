# Plan: Transformar ReCast en SaaS Template Generico

## Resumen de Decisiones

| Decision | Eleccion |
|----------|----------|
| Design System | Neutral/minimal shadcn defaults |
| RAG/Vector | Eliminar completamente |
| Billing/Stripe | Eliminar completamente |
| Roles | Eliminar completamente |
| Dashboard | Eliminar completamente |
| Landing Page | Hero minimo placeholder + CTA |
| Consumer | Eliminar completamente |
| Testing | Mantener infra + 3 smoke tests |
| Documentation | Limpiar + genericizar |
| Naming | Placeholders `[PROJECT_NAME]` |
| i18n | Mantener infra + ~25 literals esenciales |
| Auth | Email + Google, sin seleccion de rol |
| Database | Postgres generico (sin Neon dual-driver) |
| Post-Login | Redirect a `/` |

---

## Fase 1: Borrado Masivo

### 1.1 Borrar directorios completos

- [x] `consumer/` - Pipeline completo de podcasts
- [x] `app/services/rss/`
- [x] `app/services/podcast/`
- [x] `app/services/chat/`
- [x] `app/services/rag/`
- [x] `app/services/conversation/`
- [x] `app/services/feedback/`
- [x] `app/services/stripe/`
- [x] `app/services/subscription/`
- [x] `app/services/account/`
- [x] `app/components/dashboard/`
- [x] `app/components/public/`
- [x] `app/components/chat/`
- [x] `app/components/feedback/`

### 1.2 Borrar ficheros de componentes individuales

- [x] `app/components/RoleCard.tsx`
- [x] `app/components/RoleSelector.tsx`
- [x] `app/components/icons/HeadphonesIcon.tsx`
- [x] `app/components/icons/MicrophoneIcon.tsx`
- [x] `app/components/landing/HeroSection.tsx`
- [x] `app/components/landing/HowItWorksSection.tsx`
- [x] `app/components/landing/DemoPreviewSection.tsx`
- [x] `app/components/landing/PricingSection.tsx`
- [x] `app/components/landing/CTASection.tsx`
- [x] `app/components/landing/Step.tsx`

### 1.3 Borrar ficheros de schema de base de datos

- [x] `app/db/schema/podcasts.ts`
- [x] `app/db/schema/episodes.ts`
- [x] `app/db/schema/chunks.ts`
- [x] `app/db/schema/conversations.ts`
- [x] `app/db/schema/messages.ts`
- [x] `app/db/schema/subscriptions.ts`
- [x] `app/db/schema/credit_usage.ts`
- [x] `app/db/schema/feedback.ts`
- [x] `app/db/schema/relations.ts`

### 1.4 Borrar ficheros de rutas

**Rutas de Dashboard:**
- [x] `app/routes/dashboard.tsx`
- [x] `app/routes/dashboard._index.tsx`
- [x] `app/routes/dashboard.podcasts.new.tsx`
- [x] `app/routes/dashboard.podcasts.$id.chat.tsx`
- [x] `app/routes/dashboard.feedback.tsx`
- [x] `app/routes/dashboard.account.tsx`

**Ruta publica de podcast:**
- [x] `app/routes/p.$slug.tsx`

**Rutas de Stripe:**
- [x] `app/routes/api.stripe.webhook.tsx`
- [x] `app/routes/api.stripe.portal.tsx`
- [x] `app/routes/api.stripe.checkout.podcaster.tsx`
- [x] `app/routes/api.stripe.checkout.podcaster.status.tsx`
- [x] `app/routes/api.stripe.checkout.podcaster.success.tsx`

**Otras rutas:**
- [x] `app/routes/api.feedback.tsx`
- [x] `app/routes/api.__test__.*.tsx` (todos los ficheros de test routes)

### 1.5 Borrar tests E2E existentes

- [x] `tests/e2e/*.spec.ts` (todos los ficheros - se reescribiran)

---

## Fase 2: Simplificacion de Base de Datos

### 2.1 Simplificar `app/db/index.ts`

- [x] Eliminar imports de `@neondatabase/serverless` y `postgres`
- [x] Usar solo driver `pg` con `DATABASE_URL` o `DB_TEST_URL`
- [x] Mantener funcion `checkDbConnection`

### 2.2 Reescribir `app/db/schema/index.ts`

```typescript
export * from './users'
export * from './sessions'
export * from './accounts'
export * from './verifications'
```

- [x] Actualizar exports

### 2.3 Modificar `app/db/schema/users.ts`

- [x] Eliminar campo `role` completamente

### 2.4 Crear `app/db/schema/relations.ts` minimo

- [x] Solo relaciones users <-> sessions <-> accounts

---

## Fase 3: Limpieza de Rutas y Auth

### 3.1 Reescribir `app/routes.ts`

Mantener solo:
- [x] `/` (home)
- [x] `/health/db`
- [x] `/api/auth/*`
- [x] `/auth/signup`
- [x] `/auth/login`

### 3.2 Simplificar `app/routes/home.tsx`

- [x] Loader: Solo verificar si usuario esta autenticado
- [x] Component: Renderizar MinimalHero + Footer

### 3.3 Simplificar `app/routes/auth.signup.tsx`

- [x] Eliminar UI de seleccion de rol
- [x] Eliminar import de RoleSelector
- [x] Redirect directo a `/` despues de signup

### 3.4 Actualizar `app/routes/auth.login.tsx`

- [x] Redirect a `/` (no a dashboard)

### 3.5 Simplificar `app/lib/auth.ts`

- [x] Eliminar role de additionalFields
- [x] Eliminar databaseHooks para role
- [x] Actualizar comentarios con `[PROJECT_NAME]`

---

## Fase 4: Limpieza de Componentes

### 4.1 Actualizar `app/root.tsx`

- [x] Eliminar import de FeedbackButton
- [x] Actualizar imports de fuentes (Inter en vez de Cormorant Garamond)
- [x] Eliminar condicionales de dashboard/publicPodcast

### 4.2 Crear nuevo `app/components/landing/HeroSection.tsx`

```tsx
// Hero simple placeholder: titulo [PROJECT_NAME] + descripcion + boton CTA
```

- [x] Crear componente minimo

### 4.3 Actualizar `app/components/landing/Footer.tsx`

- [x] Reemplazar "ReCast" con `[PROJECT_NAME]`

### 4.4 Actualizar `app/components/Header.tsx`

- [x] Reemplazar logo "ReCast" con `[PROJECT_NAME]`

### 4.5 Actualizar `app/components/GoogleAuthButton.tsx`

- [x] Eliminar manejo de prop role

---

## Fase 5: Reset del Design System

### 5.1 Actualizar `app/app.css`

- [x] Eliminar paleta editorial (paper, pearl, silver, slate, graphite, ink)
- [x] Añadir defaults neutrales de shadcn
- [x] Eliminar referencia a fuente Cormorant Garamond
- [x] Usar fuentes Inter/system

---

## Fase 6: Minimizacion de i18n

### 6.1 Reducir locales a ~25 keys esenciales

**Keys a mantener:**
- Auth literals (login, signup, email, password, errors)
- UI comun (loading, or_divider)
- Hero placeholder
- Footer placeholders
- Theme labels

- [x] Actualizar `app/locales/en.json`
- [x] Actualizar `app/locales/es.json`

---

## Fase 7: Reescritura de Tests

### 7.1 Simplificar `tests/fixtures/`

- [x] `data.ts`: Solo fixtures de user/session/account
- [x] `seeders.ts`: Solo `seedUser`, `seedSession`, `seedAccount`

### 7.2 Actualizar `tests/helpers/auth.ts`

- [x] Eliminar parametro role

### 7.3 Crear 3 smoke tests

- [x] `tests/e2e/smoke.spec.ts` - Home page carga
- [x] `tests/e2e/auth.spec.ts` - Signup/login funciona
- [x] `tests/e2e/health.spec.ts` - DB health check

---

## Fase 8: Reescritura de Documentacion

### 8.1 Reescribir `CLAUDE.md` y `AGENTS.md`

- [ ] Overview generico con placeholder `[PROJECT_NAME]`
- [ ] Eliminar business model
- [ ] Actualizar tech stack (sin RAG, Stripe, rss-parser)
- [ ] Eliminar seccion de consumer
- [ ] Mantener patrones de arquitectura

### 8.2 Actualizar ficheros de docs

| Fichero | Accion |
|---------|--------|
| `docs/AUTH.md` | Eliminar referencias a roles |
| `docs/DATABASE.md` | Eliminar secciones Neon/pgvector |
| `docs/DEPLOYMENT.md` | Eliminar env vars de Stripe |
| `docs/TESTING.md` | Actualizar fixtures a solo auth |
| `docs/I18N.md` | Mantener tal cual (generico) |
| `docs/STYLE_GUIDE.md` | Simplificar para design neutral |
| `docs/FRONTEND_DESIGN.md` | Mantener (generico) |
| `docs/TASK_PLANNING.md` | Mantener (generico) |
| `docs/KNOWN_ISSUES.md` | Eliminar lecciones especificas de ReCast |

- [ ] `docs/AUTH.md`
- [ ] `docs/DATABASE.md`
- [ ] `docs/DEPLOYMENT.md`
- [ ] `docs/TESTING.md`
- [ ] `docs/I18N.md`
- [ ] `docs/STYLE_GUIDE.md`
- [ ] `docs/FRONTEND_DESIGN.md`
- [ ] `docs/TASK_PLANNING.md`
- [ ] `docs/KNOWN_ISSUES.md`

### 8.3 Actualizar ficheros de configuracion

- [ ] `package.json`: name -> `[project-name]`, eliminar deps no usadas
- [ ] `.env.example`: Solo vars DATABASE_URL, BETTER_AUTH_*, GOOGLE_*

---

## Ficheros Criticos (en orden de modificacion)

1. `consumer/` (borrar)
2. `app/services/` (borrar dirs de ReCast)
3. `app/components/` (borrar componentes de ReCast)
4. `app/routes/` (borrar rutas de ReCast)
5. `app/db/schema/` (borrar schemas de ReCast)
6. `app/db/schema/index.ts` (simplificar exports)
7. `app/db/index.ts` (simplificar driver)
8. `app/routes.ts` (eliminar rutas muertas)
9. `app/lib/auth.ts` (eliminar roles)
10. `app/routes/home.tsx` (simplificar)
11. `app/routes/auth.signup.tsx` (eliminar seleccion de rol)
12. `app/components/Header.tsx` (rebrand)
13. `app/components/landing/HeroSection.tsx` (crear minimo)
14. `app/components/landing/Footer.tsx` (rebrand)
15. `app/app.css` (reset de design)
16. `app/root.tsx` (fuentes, cleanup)
17. `app/locales/en.json` (minimizar)
18. `app/locales/es.json` (minimizar)
19. `tests/fixtures/` (simplificar)
20. `tests/e2e/` (reescribir)
21. `CLAUDE.md` (instrucciones de template)
22. `docs/*.md` (genericizar todos)
23. `package.json` (cleanup)
24. `.env.example` (minimizar)

---

## Checklist de Verificacion Final

- [ ] `npm run typecheck` pasa
- [ ] `npm run lint` pasa
- [ ] `npm run test:e2e` pasa (3 tests)
- [ ] Home page carga con hero placeholder
- [ ] Auth signup funciona (sin seleccion de rol)
- [ ] Auth login redirige a `/`
- [ ] Boton de Google OAuth presente
- [ ] `/health/db` devuelve "ok"
- [ ] No hay texto "ReCast" en la UI
- [ ] No hay campo role en schema de users
- [ ] No hay codigo de Stripe
- [ ] No hay codigo RAG/vector
- [ ] No existe directorio `/consumer`
- [ ] `package.json` name es `[project-name]`
- [ ] `.env.example` tiene solo vars esenciales
