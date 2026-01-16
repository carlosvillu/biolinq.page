# [PROJECT_NAME]

A production-ready SaaS template built with modern web technologies. Provides authentication, database integration, internationalization, and comprehensive testing out of the box.

## Tech Stack

- **Framework:** React Router 7 + React 19
- **Build Tool:** Vite
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Language:** TypeScript
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** Better Auth
- **Testing:** Playwright E2E + TestContainers
- **Deployment:** Netlify (configurable)

## Features

- Email + Google OAuth authentication
- Protected routes with role-based access
- PostgreSQL database with Drizzle ORM
- Internationalization (i18n) with react-i18next
- Dark/Light theme support
- Responsive mobile-first design
- Comprehensive E2E testing with TestContainers
- Type-safe environment variables
- Production-ready deployment configuration

## Prerequisites

- Node.js 20+
- npm 10+
- Docker (for E2E tests)
- PostgreSQL database (local or cloud)

## Getting Started

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd saas-template
npm install
```

### 2. Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Database
DATABASE_URL=postgresql://...

# Better Auth
BETTER_AUTH_SECRET=<random-secret-string>
BETTER_AUTH_URL=http://localhost:2025

# Google OAuth (optional)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

See `.env.example` for all available configuration options.

### 3. Database Setup

Generate and run migrations:

```bash
npm run db:generate  # Generate migrations from schema
npm run db:migrate   # Apply migrations to database
```

### 4. Development Server

```bash
npm run dev
```

App runs at `http://localhost:2025`

## Available Scripts

### Development

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 2025) |
| `npm run build` | Create production build |
| `npm run start` | Start production server |

### Code Quality

| Command | Description |
|---------|-------------|
| `npm run typecheck` | Type check with TypeScript |
| `npm run lint` | Lint with ESLint |
| `npm run format` | Format with Prettier |

### Testing

| Command | Description |
|---------|-------------|
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Run tests with Playwright UI |

### Database

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate Drizzle migrations from schema |
| `npm run db:migrate` | Apply migrations to database |
| `npm run db:studio` | Open Drizzle Studio (database GUI) |

## Project Structure

```
app/
├── routes/          # Route components (manual registration in routes.ts)
├── components/      # React components
│   ├── ui/         # shadcn/ui base components
│   └── landing/    # Landing page components
├── db/             # Database connection and schema
│   ├── index.ts    # Drizzle client
│   └── schema/     # Database schema definitions
├── lib/            # Framework-agnostic utilities
├── hooks/          # React hooks
├── locales/        # i18n translation files
└── root.tsx        # Root layout

tests/
├── e2e/            # Playwright E2E tests
├── fixtures/       # Test fixtures and seeders
└── helpers/        # TestContainers helpers

docs/               # Project documentation
├── AUTH.md         # Authentication guide
├── DATABASE.md     # Database conventions
├── DEPLOYMENT.md   # Deployment guide
├── TESTING.md      # Testing guide
├── I18N.md         # Internationalization guide
└── STYLE_GUIDE.md  # UI/UX style guide

drizzle/            # Generated migration files
```

## Documentation

Comprehensive documentation is available in the `/docs` folder:

- **[AUTH.md](docs/AUTH.md)** - Authentication setup, helpers, and route protection
- **[DATABASE.md](docs/DATABASE.md)** - Database setup, schema management, and Drizzle conventions
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Deployment configuration and environment variables
- **[TESTING.md](docs/TESTING.md)** - E2E testing with Playwright and TestContainers
- **[I18N.md](docs/I18N.md)** - Internationalization setup and adding translations
- **[STYLE_GUIDE.md](docs/STYLE_GUIDE.md)** - UI design system and component guidelines

## Architecture Principles

### Route & Component Design

- **Routes are thin:** Loaders/actions parse requests and call services
- **Components are presentational:** Render UI and orchestrate hooks
- **Business logic in services:** Domain logic lives in `app/services/`
- **State orchestration in hooks:** React-specific logic in `app/hooks/`

### Code Organization

- One component per file
- Small, focused files with single responsibility
- Explicit imports (avoid barrel exports)
- Manual route registration in `app/routes.ts`

### Testing Strategy

- E2E tests only (no unit/integration tests)
- TestContainers for database isolation
- Semantic test fixtures
- Always run with `--retries=1`

## Deployment

The template is configured for Netlify deployment but can be adapted for other platforms.

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions and environment variable configuration.

## License

MIT
