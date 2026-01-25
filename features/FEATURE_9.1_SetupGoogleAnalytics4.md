# FEATURE_9.1_SetupGoogleAnalytics4.md

## ✅ IMPLEMENTATION STATUS: 100% COMPLETE

**Verificado en producción: Sin fallos ✅**

---

## 1. Natural Language Description

**Estado actual:** La aplicacion tiene una variable de entorno `GA_MEASUREMENT_ID` definida en `.env.example` pero no se utiliza en ningun lugar. No hay tracking de Google Analytics 4 implementado. No existe ningun script de gtag.js inyectado ni componente para gestionarlo.

**Objetivo:** Integrar Google Analytics 4 (gtag.js) en la aplicacion para que:
1. Se cargue el script de GA4 en todas las paginas (tanto en produccion como en desarrollo).
2. Se envie una user property `environment` (`production` o `development`) con todos los hits, permitiendo filtrar en GA4 reports.
3. Los pageviews se trackeen automaticamente en cada navegacion SPA (React Router navigation events).
4. No se instalen dependencias npm adicionales; se usa gtag.js directamente.

**Resultado final:** Todas las paginas de la aplicacion envian pageviews a GA4 con la propiedad de entorno correspondiente. El Measurement ID se pasa desde el servidor via loader data. Las navegaciones SPA generan pageview events correctamente.

---

## 2. Technical Description

**Approach:** Inyectar el script de Google Tag (gtag.js) directamente en el `<head>` del documento via un componente React que se renderiza en el root layout. El Measurement ID y el entorno (`NODE_ENV`) se pasan desde el root loader como datos serializados al cliente.

**Arquitectura:**
- El `root.tsx` loader expone `gaMeasurementId` y `nodeEnv` al cliente.
- Un componente `GoogleAnalytics.tsx` renderiza los scripts de gtag.js condicionalmente (solo si hay un Measurement ID configurado).
- Un hook `usePageviewTracking.ts` escucha los cambios de ruta de React Router y envia `page_view` events a GA4.
- Un archivo `app/lib/gtag.client.ts` provee funciones tipadas para interactuar con `gtag()` (pageview, set user properties, etc.).

**Decisiones clave:**
- GA se carga siempre (dev y prod), con user property `environment` para filtrar.
- Sin cookies de consent en esta tarea (eso es Task 9.5).
- Sin custom events en esta tarea (eso es Task 9.2).
- El componente `GoogleAnalytics` se coloca dentro de `Layout` en el `<head>`, no en el `App` component, para que se cargue lo antes posible.
- Se usa `useLocation` de React Router para detectar navegacion SPA.

---

## 2.1. Architecture Gate

- **Pages are puzzles:** `root.tsx` solo compone componentes (`GoogleAnalytics`, `Header`, `Footer`, `Outlet`). No contiene logica de negocio.
- **Loaders/actions are thin:** El root loader solo lee `process.env.GA_MEASUREMENT_ID` y `process.env.NODE_ENV`, no ejecuta logica de dominio.
- **Business logic is not in components:**
  - La logica de tracking (cuando enviar pageview, como configurar gtag) vive en `app/lib/gtag.client.ts` y `app/hooks/usePageviewTracking.ts`.
  - `GoogleAnalytics.tsx` es puramente presentacional (renderiza scripts).

**Para cada route module:**
- `root.tsx`: loader expone `gaMeasurementId` y `nodeEnv`. Component compone `GoogleAnalytics` + layout existente.

**Para cada component:**
- `GoogleAnalytics.tsx`: Renderiza scripts de gtag.js. No contiene logica de negocio. Usa datos del loader via props.

**Para cada hook:**
- `usePageviewTracking.ts`: Usa `useLocation()` y `useEffect()` para detectar cambios de ruta y llamar a `gtag.client.ts`.

---

## 3. Files to Change/Create

### `app/lib/gtag.client.ts`
**Objective:** Proveer funciones tipadas para interactuar con la API de gtag() en el cliente. Este archivo es el unico punto de contacto con `window.gtag`.

**Pseudocode:**
```pseudocode
// Declare global gtag type
DECLARE window.gtag as function
DECLARE window.dataLayer as array

// Constants
EXPORT GA_TRACKING_EVENTS = { PAGE_VIEW: 'page_view' }

FUNCTION pageview(url: string, measurementId: string)
  IF window.gtag is undefined THEN RETURN
  CALL window.gtag('config', measurementId, { page_path: url })
END

FUNCTION setUserProperties(properties: Record<string, string>)
  IF window.gtag is undefined THEN RETURN
  CALL window.gtag('set', 'user_properties', properties)
END

FUNCTION initializeGA(measurementId: string, environment: string)
  IF window.gtag is undefined THEN RETURN
  // Set default consent (granted by default, consent banner is Task 9.5)
  CALL window.gtag('js', new Date())
  CALL window.gtag('config', measurementId, { send_page_view: false })
  // Set environment user property
  CALL setUserProperties({ environment })
END
```

---

### `app/components/GoogleAnalytics.tsx`
**Objective:** Componente que renderiza los scripts de gtag.js en el `<head>`. Solo renderiza si hay un measurementId disponible.

**Pseudocode:**
```pseudocode
COMPONENT GoogleAnalytics
  PROPS: measurementId: string | undefined, nodeEnv: string

  IF measurementId is falsy THEN RETURN null

  RENDER:
    // 1. Load gtag.js script from Google
    <script async src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} />

    // 2. Initialize dataLayer and gtag function
    <script dangerouslySetInnerHTML={{
      __html: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${measurementId}', { send_page_view: false });
        gtag('set', 'user_properties', { environment: '${nodeEnv}' });
      `
    }} />
END
```

---

### `app/hooks/usePageviewTracking.ts`
**Objective:** Hook que escucha cambios de ruta via React Router y envia page_view events a GA4.

**Pseudocode:**
```pseudocode
HOOK usePageviewTracking(measurementId: string | undefined)
  IMPORT useLocation from 'react-router'
  IMPORT useEffect from 'react'
  IMPORT { pageview } from '~/lib/gtag.client'

  GET location = useLocation()

  useEffect:
    IF measurementId is falsy THEN RETURN
    IF typeof window === 'undefined' THEN RETURN
    // Send pageview with full path including search params
    CALL pageview(location.pathname + location.search, measurementId)
  DEPENDENCIES: [location.pathname, location.search, measurementId]
END
```

---

### `app/root.tsx`
**Objective:** Modificar el loader para exponer `gaMeasurementId` y `nodeEnv` al cliente. Integrar `GoogleAnalytics` component en el Layout y `usePageviewTracking` hook en el App component.

**Pseudocode:**
```pseudocode
// LOADER changes:
FUNCTION loader
  // ... existing code (locale, session, themePreference) ...

  // ADD: Read GA measurement ID from environment
  SET gaMeasurementId = process.env.GA_MEASUREMENT_ID OR undefined
  SET nodeEnv = process.env.NODE_ENV OR 'development'

  RETURN response = {
    ...existing fields,
    gaMeasurementId,
    nodeEnv,
  }
END

// LAYOUT changes:
FUNCTION Layout
  // ADD: Get loader data from useRouteLoaderData or pass via context
  // NOTE: Layout doesn't have access to loader data directly.
  // The GA scripts will be rendered in the Layout via a special approach:
  // Pass gaMeasurementId and nodeEnv through the children (App component)
  // OR use the approach of rendering GoogleAnalytics inside the <head>
  // via the Layout receiving them as props/context.

  // ACTUALLY: In React Router 7, Layout DOES NOT receive loader data.
  // The scripts must be rendered inside App component, not Layout.
  // Alternative: Use dangerouslySetInnerHTML in Layout with a placeholder
  // that gets hydrated.

  // BEST APPROACH: Render GoogleAnalytics in the App component body,
  // but use a portal or just place it as a sibling before the main content.
  // The gtag script will still work from <body> - it doesn't need to be in <head>.

  // Keep Layout unchanged.
END

// APP component changes:
FUNCTION App
  // ... existing code ...

  // ADD: Extract GA data from loader
  SET gaMeasurementId = loaderData?.gaMeasurementId
  SET nodeEnv = loaderData?.nodeEnv ?? 'development'

  // ADD: Use pageview tracking hook
  CALL usePageviewTracking(gaMeasurementId)

  // ADD: Render GoogleAnalytics component before existing JSX
  RENDER:
    <>
      <GoogleAnalytics measurementId={gaMeasurementId} nodeEnv={nodeEnv} />
      {/* ...existing layout JSX... */}
    </>
END
```

**Nota sobre placement:** Aunque idealmente gtag.js iria en `<head>`, React Router 7 no permite acceder a loader data desde `Layout`. Renderizar el componente `GoogleAnalytics` dentro de `App` en el `<body>` funciona correctamente - gtag.js se ejecuta igual independientemente de donde este el script tag. Ademas, Google recomienda async loading que no bloquea el render.

---

### `.env.example`
**Objective:** Verificar que `GA_MEASUREMENT_ID` ya esta documentado (ya lo esta, no se requieren cambios).

**Pseudocode:**
```pseudocode
// No changes needed - GA_MEASUREMENT_ID already exists on line 41
// Already has comment: "# Google Analytics 4 (optional, for tracking)"
```

---

## 4. I18N Section

Esta tarea NO tiene UI visible al usuario (no hay textos, botones ni mensajes). Los scripts de GA son invisibles. No se requieren nuevas keys de i18n.

---

## 5. E2E Test Plan

### Test: GA4 script loads when measurement ID is configured

- **Preconditions:** El servidor tiene `GA_MEASUREMENT_ID` configurado (via variable de entorno en el test server)
- **Steps:**
  1. Navegar a `/` (landing page)
  2. Verificar que existe un script con src que contiene `googletagmanager.com/gtag/js`
  3. Verificar que `window.dataLayer` esta definido
  4. Verificar que `window.gtag` es una funcion
- **Expected:** Los scripts de GA4 estan presentes en la pagina y `gtag` esta disponible globalmente.

### Test: GA4 script does NOT load when measurement ID is not configured

- **Preconditions:** El servidor NO tiene `GA_MEASUREMENT_ID` configurado (variable vacia o no definida)
- **Steps:**
  1. Navegar a `/` (landing page)
  2. Buscar scripts con src que contenga `googletagmanager.com`
- **Expected:** No se encuentra ningun script de Google Tag Manager. `window.gtag` no esta definido.

### Test: Pageview event is sent on SPA navigation

- **Preconditions:** GA4 esta configurado. Usuario en la landing page.
- **Steps:**
  1. Navegar a `/`
  2. Capturar el estado de `window.dataLayer`
  3. Hacer click en un link interno (ej: login button navega a `/auth/login`)
  4. Verificar que se anadio un nuevo entry en `window.dataLayer` con el config del nuevo path
- **Expected:** `window.dataLayer` contiene un evento con `page_path` correspondiente a la nueva ruta.

### Test: Environment user property is set correctly

- **Preconditions:** GA4 esta configurado. Servidor corriendo en test environment.
- **Steps:**
  1. Navegar a `/`
  2. Evaluar `window.dataLayer` para buscar el set de user_properties
- **Expected:** Existe un entry en dataLayer que establece `environment` como user property (el valor sera `development` o `test` dependiendo del NODE_ENV del test server).

---

## Notas de implementacion

1. **TypeScript:** Se necesita declarar los tipos globales para `window.gtag` y `window.dataLayer` en un archivo de declaracion (puede ser inline en `gtag.client.ts` o en un `global.d.ts`).

2. **SSR Safety:** Todos los accesos a `window` deben estar guardados con `typeof window !== 'undefined'`. El componente `GoogleAnalytics` se renderizara en SSR como scripts inline que se ejecutaran en el cliente.

3. **send_page_view: false:** Se desactiva el pageview automatico de gtag.js porque lo gestionamos manualmente via el hook `usePageviewTracking` para capturar navegaciones SPA.

4. **No consent banner:** Esta tarea NO implementa consent. GA se carga siempre. La Task 9.5 anadira el banner de consent y condicional de carga.

5. **Patron existente:** Los tests E2E pueden necesitar pasar `GA_MEASUREMENT_ID` al test server. Revisar `tests/fixtures/app.fixture.ts` para ver como se pasan env vars al proceso del servidor.
