---
allowed-tools: AskUserQuestion, Read, Write, Glob, Grep
description: Create a PLANNING.md from PRD.md with phases, tasks, and subtasks following Baby Step philosophy
---

## IMPORTANT: Do NOT read docs/TASK_PLANNING.md

That document is for planning **individual tasks** within an existing PLANNING.md. This command creates the **full PLANNING.md** from a PRD — a different level of planning. Reading TASK_PLANNING.md will confuse the output.

---

## Instructions

You are a senior software architect creating a detailed implementation plan from a PRD (Product Requirements Document).

### Step 1: Read the PRD

First, read the PRD.md file at the project root:

```
Read PRD.md
```

### Step 2: Understand the Existing Codebase

Before planning, explore the existing codebase to understand:
- Current project structure
- Existing components, services, and utilities that can be reused
- Authentication setup (read `docs/AUTH.md` if auth is involved)
- Database schema (read `docs/DATABASE.md` if database changes are involved)
- Testing patterns (read `docs/TESTING.md`)
- I18N setup (read `docs/I18N.md` if UI text is involved)

### Step 3: Ask Clarifying Questions

Use `AskUserQuestion` to clarify any ambiguities. Ask about:

- **Priorities:** Which features are MVP vs nice-to-have?
- **Technical decisions:** Any preferences on specific libraries or approaches?
- **Scope clarification:** Any features that should be deferred?
- **Integration points:** External services, APIs, or dependencies not clear in the PRD
- **Timeline constraints:** Any hard deadlines affecting prioritization?
- **Existing code:** Should we reuse/refactor existing code or start fresh?

Continue asking questions until you have complete clarity on the implementation approach.

### Step 4: Create PLANNING.md

Write a `PLANNING.md` file at the project root with the following structure:

```markdown
# PLANNING.md - [Project Name]

## Overview
Brief summary of the project and this planning document.

---

## Prerrequisitos (trabajo manual)

Antes de empezar, necesitas tener configurado:

- [ ] [Prerequisite 1 - e.g., Account in external service]
- [ ] [Prerequisite 2 - e.g., API keys configured]
- [ ] [Prerequisite 3 - e.g., Environment variables in `.env.example`]

---

## Phases

### Phase 1: [Phase Name]

**🔴 Antes:** [Current state - what exists before this phase]
**🟢 Después:** [Expected state - what will exist after this phase]

#### Task 1.1: [Task Name]

- [ ] [Concrete objective 1 - specific action to accomplish]
- [ ] [Concrete objective 2 - specific action to accomplish]
- [ ] [Concrete objective 3 - specific action to accomplish]
- [ ] [Verify that tests pass and implementation works correctly]

#### Task 1.2: [Next Task]

- [ ] ...

---

### Phase 2: [Next Phase]
...

---

## Implementation Order

Sequential list of all tasks in recommended order:

1. Task 1.1 - [Name]
2. Task 1.2 - [Name]
3. Task 2.1 - [Name]
...

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| [Risk description] | [High/Medium/Low] | [How to mitigate] |

---

## Open Questions

- [ ] [Any remaining questions to resolve during implementation]

---

## Progress Tracker

| Phase | Task | Status | Notes |
|-------|------|--------|-------|
| 1 | 1.1 | ⬜ Not Started | |
| 1 | 1.2 | ⬜ Not Started | |
...

**Status Legend:** ⬜ Not Started | 🔄 In Progress | ✅ Complete | ⏸️ Blocked
```

---

## Examples

### Example 1: Phase with Before/After
```markdown
### Phase 1: Base de datos

**🔴 Antes:** No hay esquema de base de datos, no hay ORM configurado.
**🟢 Después:** Drizzle configurado, tablas creadas, migraciones funcionando.

#### Task 1.1: Configurar Drizzle ORM

- [ ] Instalar `drizzle-orm` y `drizzle-kit`
- [ ] Instalar driver de PostgreSQL (`@neondatabase/serverless`)
- [ ] Crear `drizzle.config.ts`
- [ ] Crear conexión a la base de datos en `app/db/index.ts`
- [ ] Verificar conexión con query simple (`SELECT 1`)
```

### Example 2: Authentication Tasks
```markdown
#### Task 2.1: Configurar Better Auth

- [ ] Instalar `better-auth`
- [ ] Crear `app/lib/auth.ts` con configuración base
- [ ] Configurar provider de email/password
- [ ] Configurar adapter de Drizzle para persistencia
- [ ] Verificar que Better Auth arranca sin errores

#### Task 2.2: Rutas de autenticación

- [ ] Crear ruta `/auth/signup` con formulario de registro
- [ ] Crear ruta `/auth/login` con formulario de login
- [ ] Crear ruta `/auth/logout` (action)
- [ ] Implementar lógica de registro (crear usuario en DB)
- [ ] Implementar lógica de login (verificar credenciales, crear sesión)
- [ ] Test E2E: registrar usuario, hacer login, verificar sesión
```

### Example 3: Prerequisites Section
```markdown
## Prerrequisitos (trabajo manual)

Antes de empezar, necesitas tener configurado:

- [x] Cuenta en Neon con una base de datos PostgreSQL creada
- [x] Cuenta en Stripe (modo test) con API keys
- [x] Variables de entorno documentadas en `.env.example`
```

**Guidelines:**
- ✅ Write concrete, actionable steps
- ✅ Include verification/testing as part of the checklist
- ✅ Focus on **what** needs to be accomplished
- ✅ Keep each item specific and measurable
- ✅ Order items logically (setup → implementation → verification)

---

### Planning Rules (MUST FOLLOW)

1. **Baby Step Philosophy:**
   - Each task MUST be small enough to complete with all checks passing
   - After EVERY task: tests green, lint clean, types valid
   - No task should break the build, even temporarily
   - If a task is too large, break it into smaller subtasks

2. **Logical Dependencies:**
   - Order tasks so each builds on previous work
   - Database schema before services using it
   - Services before UI consuming them
   - Core functionality before edge cases

3. **Architecture Compliance:**
   - Follow the project's architecture rules from CLAUDE.md
   - Pages are puzzles (minimal UI in routes)
   - Loaders/actions are thin (call services, return data)
   - Business logic in services, not components
   - UI orchestration in hooks, not inline

4. **Testing Strategy:**
   - Each task MUST include verification/testing steps in its checklist
   - Never complete a task without confirming tests pass
   - E2E tests are part of the task itself, not a separate phase
   - Each user-facing change should include its regression test in the same task

5. **I18N Integration:**
   - i18n keys MUST be part of the UI task itself, never a separate phase
   - Each UI task checklist must include creating/updating the necessary i18n keys
   - You cannot test UI without i18n keys - they're part of the implementation, not an afterthought

6. **Incremental Delivery:**
   - Prefer working features over partial implementations
   - Each phase should deliver usable functionality
   - MVP features before premium features

### Phase Structure Guidelines

Typical phase structure for a SaaS project:

1. **Phase 0: Foundation** - Database schema, core models, base configuration
2. **Phase 1: Core Feature** - The main value proposition of the app
3. **Phase 2: Authentication** - User accounts, sessions (if not already in template)
4. **Phase 3: Premium/Payments** - Monetization features
5. **Phase 4: Polish** - Error handling, edge cases, accessibility
6. **Phase 5: Launch Prep** - SEO, analytics, monitoring

Adjust phases based on the specific PRD requirements.

**Start by reading the PRD.md file now.**
