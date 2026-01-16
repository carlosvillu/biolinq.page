# Project Context for AI Agents

## Overview

[PROJECT_NAME] is a generic SaaS template built with modern web technologies. It provides a solid foundation for building production-ready web applications with authentication, database integration, and internationalization out of the box.

## Tech Stack

React Router 7 | React 19 | Vite | Tailwind CSS 4 | shadcn/ui | TypeScript | Playwright + TestContainers | PostgreSQL | Drizzle ORM | Better Auth

## Commands

### Web App (root)

- `npm run dev` - Development server (localhost:2025)
- `npm run build` / `npm run start` - Production build
- `npm run typecheck` / `npm run lint` - Type check and lint
- `npm run test:e2e` - Playwright E2E tests

## Documentation Index

Consult these docs when needed:

- **`docs/AUTH.md`** - Authentication conventions, server vs client helpers, route protection
- **`docs/DATABASE.md`** - Database setup, Drizzle commands, environment rules
- **`docs/DEPLOYMENT.md`** - Deployment config, environment variables, deploy commands
- **`docs/TASK_PLANNING.md`** - Planning file structure and examples
- **`docs/TESTING.md`** - TestContainers, semantic fixtures, E2E helpers
- **`docs/KNOWN_ISSUES.md`** - Lessons learned from bugfixes, edge cases, and limitations to avoid repeating mistakes
- **`docs/I18N.md`** - Internationalization setup, adding literals, adding languages

### When to read each doc (MANDATORY)

Agents **MUST read the referenced doc _before_ planning or implementing anything in that area**. This is not optional.

For planning workflows:

1. Read **`docs/TASK_PLANNING.md`**
2. Read **`docs/KNOWN_ISSUES.md`**
3. Read the user request and identify domains involved
4. Read the domain docs required (below) **before** writing the plan

Domain mapping:

- **Auth / sessions / route protection → `docs/AUTH.md`**
- **Database / Drizzle / SQL → `docs/DATABASE.md`**
- **Deployment / env vars → `docs/DEPLOYMENT.md`**
- **Testing / Playwright / TestContainers → `docs/TESTING.md`**
- **I18N / translations / UI text → `docs/I18N.md`**

UI/UX tasks MUST read both:

- **`docs/FRONTEND_DESIGN.md`**
- **`docs/STYLE_GUIDE.md`**

If the user explicitly names a doc file, the agent MUST read it before answering.

## Agent Rules (MUST FOLLOW)

### Core Principles

- **Minimal Code:** Write ONLY what's requested. THE ONLY CODE THAT NEVER FAILS IS CODE NOT WRITTEN.
- **NPX:** Always use `-y` flag
- **GitHub:** Use `gh` CLI for GitHub tasks

### Documentation Usage (MUST FOLLOW)

- **DB-related tasks:** Before planning or changing anything involving the database, Drizzle ORM, or SQL, the agent **MUST**:
  - Read and follow **`docs/DATABASE.md`**.
  - Apply its rules to all subsequent DB-related steps in that task.

- **Planning + other domains:** When the user asks to plan a task that touches database, deployment, testing or any other documented area, the agent **MUST**, after understanding the task, read all relevant docs (e.g. **`docs/DATABASE.md`**, **`docs/DEPLOYMENT.md`**, **`docs/TESTING.md`**) **before** generating the plan.

- **General rule:** Whenever a doc is referenced in this file or explicitly mentioned by the user, the agent **MUST read it before acting on that topic**.

### Task Planning (MUST FOLLOW)

- **Planning Requests:** When the user asks to *plan* or *planificar* a task (mentions like "plan", "planning", "planificar", "planning file", or asks to update `PLANNING.md` / create a feature plan), the agent **MUST**:
  - First read and follow **`docs/TASK_PLANNING.md`** for the workflow and required sections.
  - Use that document as the single source of truth for how to structure the planning output.
  - Treat this as **mandatory**, not optional, before generating any planning.

- **CRITICAL - Planning STOPS after file creation:**
  - After creating the planning file in `features/`, the agent MUST STOP.
  - DO NOT start implementing, writing code, running migrations, or creating test files.
  - DO NOT use TodoWrite to track implementation tasks during planning.
  - WAIT for explicit user approval before any implementation.
  - Implementation only begins when user explicitly says: "implementa", "implement", "ejecuta", "execute".

### Code Organization

- **Routes:** Manual registration in `app/routes.ts` (NO file-based routing)
- **Routes Language:** All routes MUST be in English (e.g., `/auth/signup`, `/auth/login`)
- **Components:** One component per file (ESLint: `react/no-multi-comp`)

### Route & UI Architecture (NON-NEGOTIABLE)

- **Pages are puzzles:** Route modules (pages) should have **no UI** or the **minimum UI** needed to compose existing components.
- **Loaders/actions are thin:** A loader/action should do the minimum to parse the `request`, decide intent, call the right service(s), and return data/redirect.
  - Loaders/actions should NOT implement domain rules, DB queries, or business invariants inline.
- **Business logic is not in components:** React components should orchestrate hooks and render UI.
  - Domain logic belongs in **services** (`app/services/*`).
  - UI/stateful orchestration belongs in **custom hooks** (`app/hooks/*`).

### Folder Intent

- **`app/services/`:** Domain/business logic, DB operations, external API calls. Callable from loaders/actions.
- **`app/hooks/`:** React-specific orchestration logic (state, effects), used by components.
- **`app/components/`:** Presentational UI and composition; no business rules.

### Other Conventions

- **Logic:** Business logic in custom Hooks/services, UI in components
- **`app/lib/`:** Framework-agnostic code only
- **`app/hooks/`:** React-specific code (useState, useEffect, etc.)
- **SOLID:** Small files, single responsibility
- **Validation:** Always use Zod for form validation (consistent with shadcn/ui forms)
- **React Hooks:** Never call hooks conditionally. If you need early returns, build safe defaults for hook inputs or split into smaller components.
- **Exports:** Avoid barrel exports that obscure boundaries in feature areas; prefer explicit imports to keep architecture and dependency direction obvious.

### Testing

- **Web app:** E2E only (Playwright), always run with `--retries=1`
- **Never complete a task without green tests**

### Definition of Done

#### Web App Tasks

1. `npm run test:e2e` passes
2. `npm run typecheck` passes
3. `npm run lint` passes
4. README.md updated if needed

**Workflow:** When done, ASK user to mark task complete in `PLANNING.md`
