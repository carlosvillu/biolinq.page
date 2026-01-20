# FEATURE_5.1_AnalyticsService.md

## 1. Natural Language Description

### Current State
El dashboard muestra el biolink del usuario con sus links, pero no hay forma de ver estadísticas. Los datos de analytics ya se están registrando:
- `biolinks.total_views` se incrementa cuando alguien visita la página pública
- `links.total_clicks` se incrementa cuando alguien hace click en un link

### Expected End State
Existe un servicio `analytics.server.ts` que:
- Usuarios **free**: pueden obtener solo `totalViews` de su biolink
- Usuarios **premium**: pueden obtener `totalViews`, `totalClicks` (suma de todos los links), y desglose de clicks por link

El servicio verifica ownership (el biolinkId debe pertenecer al usuario que hace la petición).

**Nota:** Se incluye `getLast30DaysData` para usuarios premium. Las tablas `daily_stats` y `daily_link_clicks` ya están siendo pobladas por el tracking existente (`views.server.ts` y `links.server.ts`).

---

## 2. Technical Description

### Approach
- Crear servicio en `app/services/analytics.server.ts` con funciones puras que reciben `biolinkId` y `userId`
- Verificar ownership consultando `biolinks.userId === userId`
- Verificar premium status consultando `users.is_premium`
- Queries simples a `biolinks` y `links` tables

### Architecture Decisions
- **No cache:** Las queries son simples (single row lookup + aggregation)
- **Ownership en servicio:** El servicio valida que el biolink pertenece al usuario
- **Premium gating en servicio:** El servicio verifica `is_premium` antes de devolver stats premium

### Dependencies
- Drizzle ORM (`app/db`)
- Schema: `biolinks`, `links`, `users`, `dailyStats`

---

## 2.1. Architecture Gate

- **Pages are puzzles:** N/A (este task no crea UI)
- **Loaders/actions are thin:** N/A (este task no crea routes)
- **Business logic is not in components:** ✅ Toda la lógica está en `app/services/analytics.server.ts`

---

## 3. Files to Change/Create

### `app/services/analytics.server.ts`

**Objective:** Servicio que provee estadísticas de un biolink, con verificación de ownership y premium gating.

**Pseudocode:**

```pseudocode
IMPORT db, biolinks, links, users FROM app/db

TYPE BasicStats = { totalViews: number }

TYPE PremiumStats = {
  totalViews: number
  totalClicks: number
  linksBreakdown: Array<{ linkId: string, title: string, emoji: string | null, totalClicks: number }>
}

FUNCTION getBasicStats(biolinkId: string, userId: string): Promise<BasicStats>
  // 1. Fetch biolink and verify ownership
  biolink = SELECT * FROM biolinks WHERE id = biolinkId
  
  IF biolink IS NULL
    THROW NotFoundError("Biolink not found")
  
  IF biolink.userId !== userId
    THROW ForbiddenError("Not authorized to view this biolink's stats")
  
  // 2. Return basic stats
  RETURN { totalViews: biolink.totalViews }
END

FUNCTION getPremiumStats(biolinkId: string, userId: string): Promise<PremiumStats>
  // 1. Fetch biolink with user and verify ownership + premium
  biolink = SELECT biolinks.*, users.is_premium 
            FROM biolinks 
            JOIN users ON biolinks.user_id = users.id
            WHERE biolinks.id = biolinkId
  
  IF biolink IS NULL
    THROW NotFoundError("Biolink not found")
  
  IF biolink.userId !== userId
    THROW ForbiddenError("Not authorized to view this biolink's stats")
  
  IF NOT biolink.isPremium
    THROW ForbiddenError("Premium subscription required")
  
  // 2. Fetch all links for this biolink
  linksList = SELECT id, title, emoji, total_clicks FROM links 
              WHERE biolink_id = biolinkId
              ORDER BY position ASC
  
  // 3. Calculate totals
  totalClicks = SUM(linksList.map(l => l.totalClicks))
  
  // 4. Build breakdown
  linksBreakdown = linksList.map(link => ({
    linkId: link.id,
    title: link.title,
    emoji: link.emoji,
    totalClicks: link.totalClicks
  }))
  
  RETURN {
    totalViews: biolink.totalViews,
    totalClicks,
    linksBreakdown
  }
END

TYPE DailyDataPoint = {
  date: string  // ISO date format YYYY-MM-DD
  views: number
  clicks: number
}

FUNCTION getLast30DaysData(biolinkId: string, userId: string): Promise<DailyDataPoint[]>
  // 1. Fetch biolink with user and verify ownership + premium
  biolink = SELECT biolinks.*, users.is_premium 
            FROM biolinks 
            JOIN users ON biolinks.user_id = users.id
            WHERE biolinks.id = biolinkId
  
  IF biolink IS NULL
    THROW NotFoundError("Biolink not found")
  
  IF biolink.userId !== userId
    THROW ForbiddenError("Not authorized to view this biolink's stats")
  
  IF NOT biolink.isPremium
    THROW ForbiddenError("Premium subscription required")
  
  // 2. Query daily_stats for last 30 days
  thirtyDaysAgo = NOW() - 30 days
  
  dailyData = SELECT date, views, clicks FROM daily_stats
              WHERE biolink_id = biolinkId
              AND date >= thirtyDaysAgo
              ORDER BY date ASC
  
  // 3. Return array of data points
  RETURN dailyData.map(row => ({
    date: row.date.toISOString().split('T')[0],
    views: row.views,
    clicks: row.clicks
  }))
END
```

---

### `app/routes/api.__test__.analytics.tsx`

**Objective:** Test-only API route to expose analytics service functions for E2E testing. Only available when `DB_TEST_URL` is set.

**Pseudocode:**

```pseudocode
IMPORT getBasicStats, getPremiumStats FROM ~/services/analytics.server

LOADER (GET requests)
  // 1. Guard: only in test environment
  IF NOT process.env.DB_TEST_URL
    RETURN 404 Not Found
  
  // 2. Parse query params
  type = url.searchParams.get('type')  // 'basic' | 'premium'
  biolinkId = url.searchParams.get('biolinkId')
  userId = url.searchParams.get('userId')
  
  IF NOT type OR NOT biolinkId OR NOT userId
    RETURN 400 Bad Request
  
  // 3. Call appropriate service function
  TRY
    IF type === 'basic'
      result = await getBasicStats(biolinkId, userId)
    ELSE IF type === 'premium'
      result = await getPremiumStats(biolinkId, userId)
    ELSE IF type === 'chart'
      result = await getLast30DaysData(biolinkId, userId)
    ELSE
      RETURN 400 Bad Request ("Invalid type")
    
    RETURN JSON(result)
  CATCH error
    IF error.code === 'NOT_FOUND'
      RETURN 404 JSON({ error: error.message })
    IF error.code === 'FORBIDDEN'
      RETURN 403 JSON({ error: error.message })
    THROW error
END
```

---

### `app/routes.ts`

**Objective:** Register the test API route.

**Change:** Add route registration for `api.__test__.analytics`.

```pseudocode
// Add to routes array:
route("api/__test__/analytics", "routes/api.__test__.analytics.tsx")
```

---

## 4. E2E Test Plan

### Test File: `tests/e2e/analytics-service.spec.ts`

#### Test: getBasicStats returns totalViews for owner

- **Preconditions:** 
  - User exists with biolink
  - Biolink has `total_views = 42`
- **Steps:**
  1. Call `GET /api/__test__/analytics?type=basic&biolinkId=X&userId=Y`
- **Expected:** 
  - Status 200
  - Response: `{ totalViews: 42 }`

#### Test: getBasicStats returns 404 for non-existent biolink

- **Preconditions:** User exists, no biolink with given ID
- **Steps:**
  1. Call `GET /api/__test__/analytics?type=basic&biolinkId=random-uuid&userId=Y`
- **Expected:** 
  - Status 404
  - Response: `{ error: "Biolink not found" }`

#### Test: getBasicStats returns 403 for non-owner

- **Preconditions:** 
  - User A exists with biolink
  - User B exists (different user)
- **Steps:**
  1. Call `GET /api/__test__/analytics?type=basic&biolinkId=A's-biolink&userId=B's-id`
- **Expected:** 
  - Status 403
  - Response: `{ error: "Not authorized to view this biolink's stats" }`

#### Test: getPremiumStats returns full stats for premium owner

- **Preconditions:** 
  - Premium user exists with biolink (`total_views = 100`)
  - Biolink has 3 links with clicks: 10, 20, 15
- **Steps:**
  1. Call `GET /api/__test__/analytics?type=premium&biolinkId=X&userId=Y`
- **Expected:** 
  - Status 200
  - Response: 
    ```json
    {
      "totalViews": 100,
      "totalClicks": 45,
      "linksBreakdown": [
        { "linkId": "...", "title": "Link 1", "emoji": "🔗", "totalClicks": 10 },
        { "linkId": "...", "title": "Link 2", "emoji": null, "totalClicks": 20 },
        { "linkId": "...", "title": "Link 3", "emoji": "📧", "totalClicks": 15 }
      ]
    }
    ```

#### Test: getPremiumStats returns 403 for free user

- **Preconditions:** 
  - Free user (is_premium = false) exists with biolink
- **Steps:**
  1. Call `GET /api/__test__/analytics?type=premium&biolinkId=X&userId=Y`
- **Expected:** 
  - Status 403
  - Response: `{ error: "Premium subscription required" }`

#### Test: getPremiumStats returns 403 for non-owner

- **Preconditions:** 
  - Premium user A exists with biolink
  - Premium user B exists (different user)
- **Steps:**
  1. Call `GET /api/__test__/analytics?type=premium&biolinkId=A's-biolink&userId=B's-id`
- **Expected:** 
  - Status 403
  - Response: `{ error: "Not authorized to view this biolink's stats" }`

#### Test: getLast30DaysData returns daily data for premium owner

- **Preconditions:** 
  - Premium user exists with biolink
  - `daily_stats` has entries for 3 different dates within last 30 days
- **Steps:**
  1. Call `GET /api/__test__/analytics?type=chart&biolinkId=X&userId=Y`
- **Expected:** 
  - Status 200
  - Response: array of `{ date, views, clicks }` sorted by date ASC
  - Array length = 3

#### Test: getLast30DaysData returns empty array when no data

- **Preconditions:** 
  - Premium user exists with biolink
  - No entries in `daily_stats` for this biolink
- **Steps:**
  1. Call `GET /api/__test__/analytics?type=chart&biolinkId=X&userId=Y`
- **Expected:** 
  - Status 200
  - Response: `[]`

#### Test: getLast30DaysData returns 403 for free user

- **Preconditions:** 
  - Free user (is_premium = false) exists with biolink
- **Steps:**
  1. Call `GET /api/__test__/analytics?type=chart&biolinkId=X&userId=Y`
- **Expected:** 
  - Status 403
  - Response: `{ error: "Premium subscription required" }`

---

## 5. Fixtures Needed

### New Seeders Required

```typescript
// In tests/fixtures/seeders.ts

// Update seedBiolink to accept totalViews override
seedBiolink(ctx, key, { userId, totalViews?: number })

// Update seedLink to accept totalClicks override  
seedLink(ctx, key, { biolinkId, totalClicks?: number })

// Update seedUser to accept isPremium override (if not already)
seedUser(ctx, key, { isPremium?: boolean })

// New seeder for daily_stats
seedDailyStat(ctx, { biolinkId, date: Date, views: number, clicks: number })
```

### New Fixture Data

```typescript
// In tests/fixtures/data.ts
FIXTURES.biolinks.withViews = { username: 'statsuser', totalViews: 42 }
FIXTURES.links.withClicks = { title: 'Clicked Link', url: 'https://example.com', totalClicks: 25 }

// No fixture data needed for daily_stats - seeder takes explicit values
```
