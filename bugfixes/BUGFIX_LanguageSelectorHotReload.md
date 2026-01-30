# BUGFIX_LanguageSelectorHotReload.md

## 1. Bug Description

### Current Behavior (Bug)

Cuando el usuario cambia el idioma usando el selector de idioma (icono de globo en el header), la UI no se actualiza inmediatamente. El usuario debe hacer Ctrl+R (recargar la página) para ver los textos en el nuevo idioma.

**Steps to reproduce:**
1. Navegar a http://localhost:2025 (o producción)
2. Observar que la página está en inglés (o el idioma actual)
3. Hacer clic en el icono de globo (selector de idioma) en el header
4. Seleccionar "Español" (o el idioma alternativo)
5. Observar: El menú se cierra pero **los textos de la página NO cambian**
6. Hacer Ctrl+R para recargar
7. Observar: Ahora la página SÍ está en el nuevo idioma

**Evidencia del debugging:**
- La cookie `lang=es` se establece correctamente al seleccionar el idioma
- El servidor lee la cookie correctamente después del reload
- El problema es que `i18next.changeLanguage()` no causa re-render de los componentes

### Expected Behavior (After Fix)

Después de seleccionar un idioma en el selector:
1. Todos los textos de la página deben cambiar inmediatamente al nuevo idioma
2. No debe ser necesario recargar la página
3. La cookie debe establecerse (ya funciona)
4. El atributo `lang` del `<html>` debe actualizarse (ya hay un useEffect para esto, pero depende del loader)

## 2. Technical Analysis

### Conflicting Flow

1. Usuario hace clic en idioma → `LanguageSelector` llama a `changeLanguage(locale)` de `i18n.client.ts`
2. `changeLanguage` hace:
   - `document.cookie = ...` → ✅ Funciona
   - `i18next.changeLanguage(newLocale)` → Se ejecuta pero no causa re-render
3. Los componentes que usan `useTranslation()` deberían re-renderizarse, pero NO lo hacen
4. El `locale` en `root.tsx` viene del **loader**, no del estado de i18next
5. El useEffect en `root.tsx` sincroniza `i18nInstance.changeLanguage(locale)` pero `locale` no cambia hasta el próximo request

### Root Cause

**OBVIO:** El problema es una **desconexión entre el estado de i18next y React**.

En `i18n.client.ts`, la función `changeLanguage` llama a `i18next.changeLanguage(newLocale)` usando la instancia **default** de i18next. Sin embargo:

1. **La instancia de i18next usada en el cliente** (`clientI18nInstance` en `root.tsx`) se inicializa una vez con `initI18nClientSync(locale)` y luego se pasa a `I18nextProvider`
2. **`react-i18next` requiere que la instancia pasada al provider sea la misma que se modifica**. Actualmente:
   - `i18n.client.ts` exporta `getI18nInstance()` que devuelve `i18next` (la instancia default)
   - `changeLanguage` modifica `i18next` directamente
   - `root.tsx` guarda la referencia en `clientI18nInstance` que es la misma instancia
3. **El problema real**: `react-i18next` con `bindI18n: 'languageChanged'` debería disparar re-renders, pero la configuración por defecto puede no tenerlo habilitado o hay un problema con la suscripción.

**Verificación necesaria:** La configuración de `react-i18next` en `initI18nClientSync` no especifica `bindI18n`, lo que significa que usa el default. El default debería ser `'languageChanged loaded'`, pero es posible que no esté funcionando correctamente.

**Hipótesis más probable:** El problema está en que `initReactI18next` se inicializa con `useSuspense: false` y posiblemente la suscripción a cambios de idioma no se está propagando correctamente a través del `I18nextProvider`.

## 3. Solution Plan

### `app/lib/i18n.client.ts`

**Objective:** Asegurar que `react-i18next` esté configurado para reaccionar a cambios de idioma y que la función `changeLanguage` dispare correctamente los re-renders.

**Pseudocode:**
```pseudocode
// Añadir configuración explícita de bindI18n para asegurar re-renders
FUNCTION initI18nClientSync(initialLocale)
  IF already initialized THEN
    i18next.changeLanguage(initialLocale)
    RETURN
  END IF

  i18next.use(initReactI18next).init({
    resources,
    lng: initialLocale,
    fallbackLng: DEFAULT_LOCALE,
    interpolation: { escapeValue: false },
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',  // AÑADIR: Asegurar binding explícito
      bindI18nStore: 'added removed',       // AÑADIR: Binding para cambios de store
    },
    initImmediate: false,
  })

  initialized = true
END FUNCTION

// La función changeLanguage ya está correcta, pero podemos añadir logging para debug
FUNCTION changeLanguage(newLocale)
  IF NOT isValidLocale(newLocale) THEN RETURN

  // Update cookie
  document.cookie = ...

  // Change i18next language - esto DEBE disparar re-render en react-i18next
  i18next.changeLanguage(newLocale)
END FUNCTION
```

### `app/lib/i18n.ts` (servidor)

**Objective:** Mantener consistencia con la configuración del cliente para evitar hydration mismatches.

**Pseudocode:**
```pseudocode
// Añadir misma configuración de react en createI18nInstance
FUNCTION createI18nInstance(locale)
  instance = i18next.createInstance()

  await instance.use(initReactI18next).init({
    resources,
    lng: locale,
    fallbackLng: DEFAULT_LOCALE,
    interpolation: { escapeValue: false },
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',  // AÑADIR: Consistencia con cliente
      bindI18nStore: 'added removed',
    },
  })

  RETURN instance
END FUNCTION
```

### Alternativa si lo anterior no funciona

Si la configuración de `bindI18n` no resuelve el problema, la alternativa es forzar un re-render manual:

**`app/components/LanguageSelector.tsx`**

**Pseudocode:**
```pseudocode
// Usar useRevalidator de react-router para forzar recarga de datos
IMPORT { useRevalidator } from 'react-router'

FUNCTION LanguageSelector
  { i18n } = useTranslation()
  { trackLanguageChanged } = useAnalytics()
  { revalidate } = useRevalidator()  // AÑADIR

  FUNCTION handleSelect(locale)
    changeLanguage(locale)
    trackLanguageChanged(locale)
    revalidate()  // AÑADIR: Forzar que el loader se re-ejecute
  END FUNCTION

  // ... resto del componente
END FUNCTION
```

**Nota:** Esta alternativa causa una petición al servidor pero garantiza que toda la UI se actualice correctamente. Es menos elegante pero más robusta.

## 4. Regression Tests (E2E Only)

### Test: Language selector changes UI text immediately without page reload

**File:** `tests/e2e/language-selector.spec.ts`

```markdown
### Test: Cambio de idioma actualiza textos inmediatamente
- **Preconditions:** Usuario no autenticado en la landing page
- **Steps:**
  1. Navegar a `/`
  2. Verificar que el botón de login dice "Login" (inglés)
  3. Hacer clic en el selector de idioma (botón con icono de globo)
  4. Seleccionar "Español"
  5. **Sin recargar la página**, verificar que el botón ahora dice "Iniciar sesión"
  6. Verificar que el hero text contiene "Tu presencia online"
- **Expected:** Los textos cambian inmediatamente sin necesidad de recargar

### Test: Cambio de idioma de español a inglés funciona en caliente
- **Preconditions:** Usuario con cookie `lang=es` establecida
- **Steps:**
  1. Navegar a `/` (página cargará en español)
  2. Verificar que el botón dice "Iniciar sesión"
  3. Hacer clic en el selector de idioma
  4. Seleccionar "English"
  5. **Sin recargar**, verificar que el botón ahora dice "Login"
- **Expected:** Los textos cambian inmediatamente de español a inglés

### Test: Cookie se establece correctamente al cambiar idioma
- **Preconditions:** Usuario sin cookie de idioma
- **Steps:**
  1. Navegar a `/`
  2. Cambiar idioma a "Español"
  3. Verificar que la cookie `lang=es` existe
  4. Cambiar idioma a "English"
  5. Verificar que la cookie `lang=en` existe
- **Expected:** La cookie refleja el idioma seleccionado
```

## 5. Lessons Learned

**Para añadir a `docs/KNOWN_ISSUES.md` después del fix:**

```markdown
### react-i18next requiere configuración explícita de bindI18n para hot-reload

**Date:** [fecha del fix]

**Problem:** El cambio de idioma con `i18next.changeLanguage()` no causaba re-render de los componentes que usan `useTranslation()`.

**Root Cause:** La configuración de `react-i18next` no tenía `bindI18n` explícito, y aunque el default debería funcionar, en combinación con `useSuspense: false` y SSR hydration, la suscripción a cambios de idioma no se propagaba correctamente.

**Solution:** Añadir configuración explícita:
```typescript
react: {
  useSuspense: false,
  bindI18n: 'languageChanged loaded',
  bindI18nStore: 'added removed',
}
```

**Prevention:**
- Al configurar i18next con react-i18next, siempre especificar `bindI18n` explícitamente
- Probar el cambio de idioma en caliente como parte del desarrollo de features de i18n
- Considerar añadir un test E2E para el cambio de idioma en caliente
```
