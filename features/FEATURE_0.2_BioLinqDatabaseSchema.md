# FEATURE_0.2_BioLinqDatabaseSchema.md

## 1. Natural Language Description

### Current State
El proyecto tiene un schema de base de datos básico heredado del template SaaS:
- Tabla `users` con campos de autenticación (id, email, name, emailVerified, image, createdAt, updatedAt)
- Tablas de Better Auth: `sessions`, `accounts`, `verifications`
- Relaciones básicas entre users, sessions y accounts

### Expected End State
El schema de base de datos estará completo para soportar todas las funcionalidades de BioLinq:
- Tabla `users` extendida con campos de premium y Stripe
- Tabla `biolinks` para los perfiles públicos de cada usuario (relación 1:1 con users)
- Tabla `links` para los enlaces de cada biolink (máximo 5 por biolink)
- Tablas de analytics: `daily_stats` y `daily_link_clicks` para métricas premium
- Enum de PostgreSQL para los temas disponibles
- Constante con usernames reservados para evitar conflictos con rutas
- Todas las relaciones definidas en Drizzle ORM

---

## 2. Technical Description

### Approach
1. **Extender tabla `users`**: Añadir campos `is_premium` y `stripe_customer_id` para gestión de suscripciones
2. **Crear enum `theme`**: Enum de PostgreSQL con los 4 temas disponibles (brutalist, light_minimal, dark_mode, colorful)
3. **Crear tabla `biolinks`**: Perfil público del usuario con username único, tema seleccionado y colores custom
4. **Crear tabla `links`**: Enlaces del biolink con emoji, título, URL, posición y contador de clicks
5. **Crear tablas de analytics**: `daily_stats` para vistas/clicks diarios del biolink, `daily_link_clicks` para clicks por enlace
6. **Definir relaciones**: Actualizar `relations.ts` con todas las nuevas relaciones
7. **Crear constantes**: Lista de usernames reservados en `app/lib/constants.ts`

### Architecture Decisions
- **UUID para todas las PKs**: Consistente con el schema existente de Better Auth
- **Enum de PostgreSQL para themes**: Type-safety a nivel de DB, evita valores inválidos
- **Colores con formato `#RRGGBB`**: varchar(7) incluyendo el `#`
- **Timestamps con hora**: `daily_stats.date` y `daily_link_clicks.date` serán `timestamp` para mayor precisión
- **Cascade deletes**: Todas las FK con `ON DELETE CASCADE` para limpieza automática
- **Índices**: En `username`, `(biolink_id, date)`, `(link_id, date)` para queries frecuentes

### Dependencies
- Drizzle ORM (ya instalado)
- PostgreSQL (ya configurado)

---

## 2.1. Architecture Gate

- **Pages are puzzles:** N/A - Esta tarea no involucra rutas ni UI
- **Loaders/actions are thin:** N/A - Esta tarea no involucra loaders/actions
- **Business logic is not in components:** N/A - Esta tarea es puramente de schema de DB

Esta tarea es de **infraestructura de base de datos**, no hay componentes, hooks ni servicios involucrados.

---

## 3. Files to Change/Create

### `app/db/schema/users.ts`
**Objective:** Extender la tabla users existente con campos para premium y Stripe

**Pseudocode:**
```pseudocode
// Añadir a la tabla users existente:
FIELD is_premium
  TYPE: boolean
  DEFAULT: false
  NOT NULL: true

FIELD stripe_customer_id
  TYPE: varchar(255)
  NULLABLE: true
```

---

### `app/db/schema/biolinks.ts` (NEW)
**Objective:** Crear tabla para los perfiles públicos de biolink

**Pseudocode:**
```pseudocode
// Primero definir el enum de temas
ENUM biolink_theme
  VALUES: 'brutalist', 'light_minimal', 'dark_mode', 'colorful'

TABLE biolinks
  FIELD id
    TYPE: uuid
    PRIMARY KEY
    DEFAULT: random uuid

  FIELD user_id
    TYPE: uuid
    UNIQUE: true (cada user solo puede tener 1 biolink)
    FOREIGN KEY: references users(id) ON DELETE CASCADE
    NOT NULL: true

  FIELD username
    TYPE: varchar(20)
    UNIQUE: true
    NOT NULL: true

  FIELD theme
    TYPE: biolink_theme (enum)
    DEFAULT: 'light_minimal'
    NOT NULL: true

  FIELD custom_primary_color
    TYPE: varchar(7)  // #RRGGBB format
    NULLABLE: true

  FIELD custom_bg_color
    TYPE: varchar(7)  // #RRGGBB format
    NULLABLE: true

  FIELD total_views
    TYPE: integer
    DEFAULT: 0
    NOT NULL: true

  FIELD created_at
    TYPE: timestamp
    DEFAULT: now()
    NOT NULL: true

  FIELD updated_at
    TYPE: timestamp
    DEFAULT: now()
    NOT NULL: true

INDEX idx_biolinks_username ON username
```

**Types to export:**
- `Biolink` (select type)
- `NewBiolink` (insert type)
- `BiolinkTheme` (enum type)

---

### `app/db/schema/links.ts` (NEW)
**Objective:** Crear tabla para los enlaces de cada biolink

**Pseudocode:**
```pseudocode
TABLE links
  FIELD id
    TYPE: uuid
    PRIMARY KEY
    DEFAULT: random uuid

  FIELD biolink_id
    TYPE: uuid
    FOREIGN KEY: references biolinks(id) ON DELETE CASCADE
    NOT NULL: true

  FIELD emoji
    TYPE: varchar(10)
    NULLABLE: true

  FIELD title
    TYPE: varchar(50)
    NOT NULL: true

  FIELD url
    TYPE: text
    NOT NULL: true

  FIELD position
    TYPE: integer
    NOT NULL: true

  FIELD total_clicks
    TYPE: integer
    DEFAULT: 0
    NOT NULL: true

  FIELD created_at
    TYPE: timestamp
    DEFAULT: now()
    NOT NULL: true

  FIELD updated_at
    TYPE: timestamp
    DEFAULT: now()
    NOT NULL: true
```

**Types to export:**
- `Link` (select type)
- `NewLink` (insert type)

---

### `app/db/schema/dailyStats.ts` (NEW)
**Objective:** Crear tabla para estadísticas diarias del biolink (analytics premium)

**Pseudocode:**
```pseudocode
TABLE daily_stats
  FIELD id
    TYPE: uuid
    PRIMARY KEY
    DEFAULT: random uuid

  FIELD biolink_id
    TYPE: uuid
    FOREIGN KEY: references biolinks(id) ON DELETE CASCADE
    NOT NULL: true

  FIELD date
    TYPE: timestamp
    NOT NULL: true

  FIELD views
    TYPE: integer
    DEFAULT: 0
    NOT NULL: true

  FIELD clicks
    TYPE: integer
    DEFAULT: 0
    NOT NULL: true

  FIELD created_at
    TYPE: timestamp
    DEFAULT: now()
    NOT NULL: true

UNIQUE CONSTRAINT unique_biolink_date ON (biolink_id, date)
INDEX idx_daily_stats_biolink_date ON (biolink_id, date)
```

**Types to export:**
- `DailyStat` (select type)
- `NewDailyStat` (insert type)

---

### `app/db/schema/dailyLinkClicks.ts` (NEW)
**Objective:** Crear tabla para clicks diarios por enlace (analytics premium)

**Pseudocode:**
```pseudocode
TABLE daily_link_clicks
  FIELD id
    TYPE: uuid
    PRIMARY KEY
    DEFAULT: random uuid

  FIELD link_id
    TYPE: uuid
    FOREIGN KEY: references links(id) ON DELETE CASCADE
    NOT NULL: true

  FIELD date
    TYPE: timestamp
    NOT NULL: true

  FIELD clicks
    TYPE: integer
    DEFAULT: 0
    NOT NULL: true

  FIELD created_at
    TYPE: timestamp
    DEFAULT: now()
    NOT NULL: true

UNIQUE CONSTRAINT unique_link_date ON (link_id, date)
INDEX idx_daily_link_clicks_link_date ON (link_id, date)
```

**Types to export:**
- `DailyLinkClick` (select type)
- `NewDailyLinkClick` (insert type)

---

### `app/db/schema/relations.ts`
**Objective:** Actualizar las relaciones existentes y añadir las nuevas

**Pseudocode:**
```pseudocode
// Mantener relaciones existentes (users <-> sessions, users <-> accounts)

// Añadir nuevas relaciones:

RELATION usersRelations (actualizar)
  ADD: biolink (one) -> biolinks

RELATION biolinksRelations (new)
  user (one) -> users via user_id
  links (many) -> links
  dailyStats (many) -> daily_stats

RELATION linksRelations (new)
  biolink (one) -> biolinks via biolink_id
  dailyLinkClicks (many) -> daily_link_clicks

RELATION dailyStatsRelations (new)
  biolink (one) -> biolinks via biolink_id

RELATION dailyLinkClicksRelations (new)
  link (one) -> links via link_id
```

---

### `app/db/schema/index.ts`
**Objective:** Exportar todos los nuevos schemas

**Pseudocode:**
```pseudocode
// Añadir exports para:
EXPORT * from './biolinks'
EXPORT * from './links'
EXPORT * from './dailyStats'
EXPORT * from './dailyLinkClicks'
```

---

### `app/lib/constants.ts` (NEW)
**Objective:** Crear constante con usernames reservados

**Pseudocode:**
```pseudocode
CONSTANT RESERVED_USERNAMES: string[]
  VALUES: [
    // Rutas del sistema
    'admin', 'api', 'www', 'app', 'dashboard', 'login', 'signup',
    'settings', 'premium', 'help', 'support', 'terms', 'privacy', 'go',
    // Rutas adicionales (confirmadas por usuario)
    'about', 'contact', 'blog', 'pricing',
    'static', 'assets', 'public',
    'auth', 'account', 'profile'
  ]

// Función helper para validar
FUNCTION isReservedUsername(username: string): boolean
  RETURN RESERVED_USERNAMES.includes(username.toLowerCase())
```

---

## 4. I18N

N/A - Esta tarea no involucra UI ni textos visibles al usuario.

---

## 5. E2E Test Plan

Esta tarea es puramente de schema de base de datos. **No se requieren tests E2E**.

### Verificación manual requerida:
1. Ejecutar `npm run db:generate` - debe generar migración sin errores
2. Ejecutar `npm run db:migrate` - debe aplicar migración sin errores
3. Verificar schema en DB con query SQL:
   ```sql
   -- Verificar tablas creadas
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('biolinks', 'links', 'daily_stats', 'daily_link_clicks');
   
   -- Verificar enum creado
   SELECT typname, enumlabel FROM pg_enum 
   JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
   WHERE typname = 'biolink_theme';
   
   -- Verificar columnas añadidas a users
   SELECT column_name, data_type FROM information_schema.columns 
   WHERE table_name = 'users' 
   AND column_name IN ('is_premium', 'stripe_customer_id');
   ```

---

## 6. Implementation Checklist

- [ ] Update `app/db/schema/users.ts` - add `is_premium` and `stripe_customer_id`
- [ ] Create `app/db/schema/biolinks.ts` - with enum and table
- [ ] Create `app/db/schema/links.ts`
- [ ] Create `app/db/schema/dailyStats.ts`
- [ ] Create `app/db/schema/dailyLinkClicks.ts`
- [ ] Update `app/db/schema/relations.ts` - add all new relations
- [ ] Update `app/db/schema/index.ts` - export new schemas
- [ ] Create `app/lib/constants.ts` - reserved usernames
- [ ] Run `npm run db:generate`
- [ ] Run `npm run db:migrate`
- [ ] Verify schema with SQL queries
- [ ] Run `npm run typecheck`
- [ ] Run `npm run lint`
