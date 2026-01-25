# FEATURE_5.2_StatsComponents.md

## ✅ IMPLEMENTATION STATUS: 100% COMPLETE

**Verificado en producción: Sin fallos ✅**

---

## 1. Natural Language Description

### Current State (Before)
El dashboard tiene un componente `StatsCard` básico que muestra:
- **Total Views**: visible para todos los usuarios
- **Clicks**: bloqueado con badge "PREMIUM" para usuarios free

No hay gráfico de actividad diaria ni desglose de clicks por link. Los usuarios premium no pueden ver sus analytics completas.

### Expected State (After)
El dashboard tendrá una sección de stats completa con:
- **StatsOverview**: Total views (visible para todos) + Total clicks (locked para free)
- **DailyChart**: Gráfico CSS-only de 7 días (locked para free)
- **LinkPerformance**: Barras de clicks por link usando Base UI Meter (locked para free)

**Regla de visibilidad:**
- **Free users**: Solo ven `totalViews`. Todo lo demás muestra overlay "PREMIUM" sin datos de ejemplo.
- **Premium users**: Ven todos los stats completos.

---

## 2. Technical Description

### High-Level Approach
1. **Refactorizar `StatsCard.tsx`** → Renombrar a `StatsOverview.tsx` y mantener la lógica actual
2. **Crear `DailyChart.tsx`** → Gráfico CSS-only de barras verticales para 7 días
3. **Crear `LinkPerformance.tsx`** → Lista de links con barras de progreso usando Base UI `Meter`
4. **Crear `PremiumLock.tsx`** → Componente reutilizable para overlay de bloqueo premium
5. **Modificar dashboard loader** → Cargar datos de analytics (7 días, links breakdown)
6. **Modificar dashboard route** → Componer los nuevos componentes en la sección de stats

### Architecture Decisions
- **CSS-only chart**: No se añade librería de gráficos. Barras verticales con `height` calculado en porcentaje.
- **Base UI Meter**: Para las barras de clicks por link, aprovechando accesibilidad built-in.
- **7 días fijos**: El gráfico muestra los últimos 7 días, sin selector de rango.
- **Todos los links**: `LinkPerformance` muestra todos los links del usuario, no solo top N.

### Dependencies
- `@base-ui-components/react/meter` (ya instalado como parte de Base UI)
- Analytics service existente (`app/services/analytics.server.ts`)

---

## 2.1. Architecture Gate

- **Pages are puzzles:** `dashboard.tsx` solo compone componentes, no tiene lógica de UI.
- **Loaders/actions are thin:** El loader llama a `getBasicStats()` y `getPremiumStats()` del analytics service.
- **Business logic is not in components:**
  - Cálculos de porcentajes para barras → helper en `app/lib/stats.ts`
  - Formateo de fechas → helper existente o nuevo en `app/lib/format.ts`
  - Componentes solo renderizan datos recibidos por props

### Route Module: `dashboard.tsx`
- **Loader**: Llama a `getBasicStats()` siempre. Si `isPremium`, también llama a `getLast7DaysData()` y `getPremiumStats()`.
- **Action**: Sin cambios (no hay acciones de stats).
- **Component**: Compone `StatsOverview`, `DailyChart`, `LinkPerformance` dentro de un contenedor.

### Components
- **`StatsOverview`**: Recibe `totalViews`, `totalClicks`, `isPremium`. Usa `PremiumLock` para clicks.
- **`DailyChart`**: Recibe `data: DailyDataPoint[]`, `isPremium`. Usa `PremiumLock` si no premium.
- **`LinkPerformance`**: Recibe `links: LinkBreakdown[]`, `isPremium`. Usa Base UI `Meter` + `PremiumLock`.
- **`PremiumLock`**: Componente de overlay reutilizable con badge "PREMIUM".

---

## 3. Files to Change/Create

### `app/lib/stats.ts` (NEW)
**Objective:** Helpers para cálculos de stats (porcentajes, máximos).

**Pseudocode:**
```pseudocode
FUNCTION calculatePercentage(value, max)
  IF max === 0 THEN RETURN 0
  RETURN Math.round((value / max) * 100)
END

FUNCTION getMaxValue(dataPoints, key)
  RETURN Math.max(...dataPoints.map(d => d[key]), 1)
END

FUNCTION getLast7Days()
  // Genera array de 7 fechas (hoy - 6 días hasta hoy)
  RETURN dates[]
END

FUNCTION fillMissingDays(data, days)
  // Rellena días sin datos con views=0, clicks=0
  RETURN filledData[]
END
```

---

### `app/components/dashboard/PremiumLock.tsx` (NEW)
**Objective:** Overlay reutilizable para secciones bloqueadas por premium.

**Pseudocode:**
```pseudocode
COMPONENT PremiumLock
  PROPS: children (optional, for sizing reference)
  
  RENDER:
    <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-[2px]">
      <span className="premium-badge">PREMIUM</span>
    </div>
END
```

**Styling:** Neo-Brutal badge con `bg-neo-accent`, border, shadow.

---

### `app/components/dashboard/StatsOverview.tsx` (RENAME from StatsCard.tsx)
**Objective:** Mostrar total views y total clicks. Refactorizar para usar `PremiumLock`.

**Pseudocode:**
```pseudocode
COMPONENT StatsOverview
  PROPS: totalViews: number, totalClicks: number | null, isPremium: boolean
  
  HOOKS:
    const { t } = useTranslation()
  
  RENDER:
    <NeoBrutalCard>
      <div className="grid grid-cols-2 gap-4">
        {/* Total Views - siempre visible */}
        <StatItem label={t('dashboard_total_views')} value={formatNumber(totalViews)} />
        
        {/* Total Clicks - locked para free */}
        <div className="relative">
          <StatItem label={t('dashboard_total_clicks')} value={isPremium ? formatNumber(totalClicks) : '---'} />
          IF !isPremium THEN <PremiumLock />
        </div>
      </div>
    </NeoBrutalCard>
END

COMPONENT StatItem
  PROPS: label: string, value: string
  RENDER:
    <div>
      <h3 className="text-sm font-bold text-gray-500 uppercase">{label}</h3>
      <p className="text-3xl font-black mt-1">{value}</p>
    </div>
END
```

---

### `app/components/dashboard/DailyChart.tsx` (NEW)
**Objective:** Gráfico CSS-only de barras verticales para 7 días.

**Pseudocode:**
```pseudocode
COMPONENT DailyChart
  PROPS: data: DailyDataPoint[], isPremium: boolean
  
  HOOKS:
    const { t } = useTranslation()
  
  COMPUTE:
    maxViews = getMaxValue(data, 'views')
    maxClicks = getMaxValue(data, 'clicks')
  
  RENDER:
    <NeoBrutalCard>
      <h3 className="font-bold mb-4">{t('stats_daily_activity')}</h3>
      
      <div className="relative">
        IF !isPremium THEN <PremiumLock />
        
        <div className="flex items-end justify-between gap-2 h-32">
          FOR each day IN data:
            <DayBar 
              date={day.date}
              views={day.views}
              clicks={day.clicks}
              maxViews={maxViews}
              maxClicks={maxClicks}
              isPremium={isPremium}
            />
        </div>
        
        {/* Legend */}
        <div className="flex gap-4 mt-4 text-xs">
          <span>🟠 {t('stats_views')}</span>
          <span>🔵 {t('stats_clicks')}</span>
        </div>
      </div>
    </NeoBrutalCard>
END

COMPONENT DayBar
  PROPS: date, views, clicks, maxViews, maxClicks, isPremium
  
  COMPUTE:
    viewsHeight = calculatePercentage(views, maxViews)
    clicksHeight = calculatePercentage(clicks, maxClicks)
    dayLabel = formatDayShort(date) // "Mon", "Tue", etc.
  
  RENDER:
    <div className="flex flex-col items-center flex-1">
      <div className="flex gap-0.5 items-end h-24">
        {/* Views bar */}
        <div 
          className="w-3 bg-neo-primary border border-neo-dark rounded-t-sm transition-all"
          style={{ height: `${viewsHeight}%` }}
        />
        {/* Clicks bar */}
        <div 
          className="w-3 bg-neo-input border border-neo-dark rounded-t-sm transition-all"
          style={{ height: `${clicksHeight}%` }}
        />
      </div>
      <span className="text-xs mt-1 text-gray-500">{dayLabel}</span>
    </div>
END
```

---

### `app/components/dashboard/LinkPerformance.tsx` (NEW)
**Objective:** Lista de links con barras de clicks usando Base UI Meter.

**Pseudocode:**
```pseudocode
COMPONENT LinkPerformance
  PROPS: links: LinkBreakdown[], isPremium: boolean
  
  HOOKS:
    const { t } = useTranslation()
  
  COMPUTE:
    maxClicks = getMaxValue(links, 'totalClicks')
  
  RENDER:
    <NeoBrutalCard>
      <h3 className="font-bold mb-4">{t('stats_link_performance')}</h3>
      
      <div className="relative">
        IF !isPremium THEN <PremiumLock />
        
        IF links.length === 0 THEN
          <p className="text-gray-500 text-sm">{t('stats_no_links')}</p>
        ELSE
          <div className="space-y-3">
            FOR each link IN links:
              <LinkMeter 
                emoji={link.emoji}
                title={link.title}
                clicks={link.totalClicks}
                maxClicks={maxClicks}
              />
          </div>
      </div>
    </NeoBrutalCard>
END

COMPONENT LinkMeter
  PROPS: emoji, title, clicks, maxClicks
  
  COMPUTE:
    percentage = calculatePercentage(clicks, maxClicks)
  
  RENDER:
    <Meter.Root value={percentage} className="space-y-1">
      <div className="flex justify-between items-center">
        <Meter.Label className="text-sm font-medium truncate">
          {emoji && <span className="mr-1">{emoji}</span>}
          {title}
        </Meter.Label>
        <Meter.Value className="text-sm text-gray-500">
          {formatNumber(clicks)} clicks
        </Meter.Value>
      </div>
      <Meter.Track className="h-2 bg-gray-100 border border-neo-dark rounded-sm overflow-hidden">
        <Meter.Indicator className="h-full bg-neo-primary transition-all" />
      </Meter.Track>
    </Meter.Root>
END
```

---

### `app/services/analytics.server.ts` (MODIFY)
**Objective:** Añadir función `getLast7DaysData()` (wrapper de `getLast30DaysData` filtrado).

**Pseudocode:**
```pseudocode
FUNCTION getLast7DaysData(biolinkId, userId)
  // Reutiliza getLast30DaysData pero filtra a 7 días
  result = await getLast30DaysData(biolinkId, userId)
  
  IF !result.success THEN RETURN result
  
  // Filtrar últimos 7 días
  sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  filteredData = result.data.filter(d => new Date(d.date) >= sevenDaysAgo)
  
  RETURN { success: true, data: filteredData }
END
```

**Alternativa:** Modificar `getLast30DaysData` para aceptar parámetro `days` opcional.

---

### `app/routes/dashboard.tsx` (MODIFY)
**Objective:** Cargar datos de analytics y componer nuevos componentes.

**Pseudocode:**
```pseudocode
LOADER:
  // Existing code...
  authSession = await getCurrentUser(request)
  biolink = await getUserBiolink(authSession.user.id)
  links = await getLinksByBiolinkId(...)
  
  // NEW: Load analytics
  basicStats = await getBasicStats(biolink.id, authSession.user.id)
  
  premiumStats = null
  dailyData = []
  
  IF authSession.user.isPremium THEN
    premiumStatsResult = await getPremiumStats(biolink.id, authSession.user.id)
    IF premiumStatsResult.success THEN premiumStats = premiumStatsResult.data
    
    dailyDataResult = await getLast7DaysData(biolink.id, authSession.user.id)
    IF dailyDataResult.success THEN dailyData = dailyDataResult.data
  
  RETURN {
    user, biolink, links,
    stats: {
      totalViews: basicStats.success ? basicStats.data.totalViews : 0,
      totalClicks: premiumStats?.totalClicks ?? null,
      linksBreakdown: premiumStats?.linksBreakdown ?? [],
      dailyData: fillMissingDays(dailyData, getLast7Days()),
    }
  }
END

COMPONENT DashboardPage:
  const { user, biolink, links, stats } = useLoaderData()
  
  RENDER:
    <div className="min-h-screen bg-neo-input/30">
      {!user.isPremium && <PremiumBanner />}
      
      <main className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-[1.5fr_1fr] gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Stats Section */}
          <div className="space-y-4">
            <StatsOverview 
              totalViews={stats.totalViews}
              totalClicks={stats.totalClicks}
              isPremium={user.isPremium}
            />
            <DailyChart 
              data={stats.dailyData}
              isPremium={user.isPremium}
            />
            <LinkPerformance 
              links={stats.linksBreakdown}
              isPremium={user.isPremium}
            />
          </div>
          
          <LinksList ... />
          <CustomizationSection ... />
        </div>
        
        <LivePreview ... />
      </main>
    </div>
END
```

---

### `app/components/dashboard/index.ts` (MODIFY)
**Objective:** Exportar nuevos componentes.

**Changes:**
```typescript
// Remove: export { StatsCard } from './StatsCard'
// Add:
export { StatsOverview } from './StatsOverview'
export { DailyChart } from './DailyChart'
export { LinkPerformance } from './LinkPerformance'
export { PremiumLock } from './PremiumLock'
```

---

### `app/lib/format.ts` (MODIFY)
**Objective:** Añadir helper para formatear día corto.

**Pseudocode:**
```pseudocode
FUNCTION formatDayShort(dateString: string): string
  // "2024-01-15" → "Mon"
  const date = new Date(dateString)
  RETURN date.toLocaleDateString('en-US', { weekday: 'short' })
END
```

---

## 4. I18N

### Existing keys to reuse
- `dashboard_total_views` - Para label de total views
- `dashboard_clicks` - Para label de clicks (renombrar a `dashboard_total_clicks` para consistencia)

### New keys to create

| Key | English | Spanish |
|-----|---------|---------|
| `dashboard_total_clicks` | Total Clicks | Clicks Totales |
| `stats_daily_activity` | Daily Activity (7 days) | Actividad Diaria (7 días) |
| `stats_views` | Views | Visitas |
| `stats_clicks` | Clicks | Clicks |
| `stats_link_performance` | Link Performance | Rendimiento de Links |
| `stats_no_links` | No links to show | No hay links que mostrar |
| `stats_clicks_label` | clicks | clicks |

---

## 5. E2E Test Plan

### Test: Free user sees total views but premium sections are locked
- **Preconditions:** User logged in, has biolink, is NOT premium
- **Steps:**
  1. Navigate to `/dashboard`
  2. Check StatsOverview section
  3. Check DailyChart section
  4. Check LinkPerformance section
- **Expected:**
  - Total views number is visible
  - Total clicks shows "PREMIUM" overlay
  - DailyChart shows "PREMIUM" overlay (no chart visible)
  - LinkPerformance shows "PREMIUM" overlay (no bars visible)

### Test: Premium user sees full analytics
- **Preconditions:** User logged in, has biolink, IS premium, has links with clicks
- **Steps:**
  1. Navigate to `/dashboard`
  2. Check all stats sections
- **Expected:**
  - Total views and total clicks are visible with numbers
  - DailyChart shows 7 bars with views/clicks
  - LinkPerformance shows all links with click bars
  - No "PREMIUM" overlays visible

### Test: DailyChart renders 7 days correctly
- **Preconditions:** Premium user with daily stats data
- **Steps:**
  1. Navigate to `/dashboard`
  2. Count bars in DailyChart
- **Expected:**
  - Exactly 7 day columns visible
  - Each column has day label (Mon, Tue, etc.)
  - Legend shows views and clicks indicators

### Test: LinkPerformance shows all user links
- **Preconditions:** Premium user with 3 links, each with different click counts
- **Steps:**
  1. Navigate to `/dashboard`
  2. Check LinkPerformance section
- **Expected:**
  - 3 link items visible
  - Each shows emoji (if set), title, and click count
  - Progress bars reflect relative click counts

### Test: Stats section appears above links editor
- **Preconditions:** User logged in with biolink
- **Steps:**
  1. Navigate to `/dashboard`
  2. Check vertical order of sections
- **Expected:**
  - Stats sections (Overview, Chart, Performance) appear before LinksList
  - Order: PremiumBanner (if free) → Stats → Links → Customization

---

## 6. Implementation Notes

### Base UI Meter Import
```tsx
import { Meter } from '@base-ui-components/react/meter'
```

### Neo-Brutal Styling for Meter
Apply border and shadow to `Meter.Track`:
```tsx
<Meter.Track className="h-2 bg-gray-100 border border-neo-dark rounded-sm overflow-hidden shadow-[1px_1px_0_0_rgba(0,0,0,1)]">
```

### Responsive Considerations
- On mobile, stats sections stack vertically
- DailyChart bars should have `min-width` to remain visible
- LinkPerformance titles should truncate with ellipsis

### Performance
- Stats data is loaded in the loader (SSR)
- No client-side fetching needed
- Charts are pure CSS, no JS animation libraries
