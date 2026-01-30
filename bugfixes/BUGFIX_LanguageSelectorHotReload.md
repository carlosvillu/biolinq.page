# BUGFIX_LanguageSelectorHotReload.md

## 1. Bug Description

### Current Behavior (Bug)

Cuando el usuario selecciona un idioma diferente en el selector de idioma (LanguageSelector), la página **no actualiza el texto en caliente**. El idioma solo cambia después de recargar la página manualmente.

**Steps to reproduce:**
1. Ir a la página principal `/`
2. Verificar que el texto está en inglés (ej: "Simple Pricing")
3. Click en el botón de selector de idioma (icono de globo)
4. Seleccionar "Español"
5. Observar: El texto **NO** cambia a español ("Precios Simples")
6. Recargar la página manualmente
7. Ahora el texto aparece en español

### Expected Behavior (After Fix)

Después de seleccionar un idioma diferente:
1. El menú se cierra
2. Todo el texto de la página cambia inmediatamente al nuevo idioma **sin necesidad de recargar**
3. La cookie de idioma se actualiza correctamente

## 2. Technical Analysis

### Conflicting Flow

1. Usuario hace click en "Español" en el LanguageSelector
2. Se ejecuta `handleSelect('es')`:
   - `changeLanguage('es')` - Cambia i18next + cookie
   - `trackLanguageChanged('es')` - Envía evento a GA4
3. **PROBLEMA**: El cambio de idioma no se refleja en la UI

### Root Cause

**TEORÍAS A INVESTIGAR:**

#### Teoría 1: El hook `useAnalytics` causa un re-render que interfiere
El componente `LanguageSelector` ahora usa `useAnalytics()` que devuelve funciones estáticas. Sin embargo, si el hook se re-evalúa en cada render, podría estar causando una condición de carrera donde el componente se desmonta/remonta antes de que i18next propague el cambio.

**Investigación:**
- Verificar si `useAnalytics` devuelve referencias estables
- Comparar el comportamiento de re-render antes/después del commit malo

#### Teoría 2: `window.gtag` no está definido y causa un error silencioso
La función `trackLanguageChanged` verifica si `window.gtag` existe, pero podría haber un error no capturado que interrumpe la ejecución.

**Investigación:**
- Abrir DevTools y verificar errores en consola
- Agregar logs antes y después de cada línea en `handleSelect`

#### Teoría 3: El orden de llamadas es incorrecto
`changeLanguage` debe ejecutarse y completar antes de cualquier otra operación. Si `trackLanguageChanged` se ejecuta síncronamente y bloquea de alguna manera, podría interferir.

**Investigación:**
- Invertir el orden: llamar primero a `trackLanguageChanged` y luego a `changeLanguage`
- Probar con `setTimeout` para separar las llamadas

### Commit que introdujo la regresión

**Commit:** `e2c719d4ca5511c17bb7bfcfc51004d414d3387f`
**Mensaje:** `feat(analytics): implement GA4 custom events tracking (Task 9.2)`
**Fecha:** Sat Jan 24 17:23:09 2026 +0100

**Cambio específico en LanguageSelector.tsx:**
```diff
+ import { useAnalytics } from '~/hooks/useAnalytics'

  export function LanguageSelector() {
    const { i18n } = useTranslation()
+   const { trackLanguageChanged } = useAnalytics()
    const currentLocale = isValidLocale(i18n.language) ? i18n.language : DEFAULT_LOCALE

    const handleSelect = (locale: string) => {
      changeLanguage(locale as Locale)
+     trackLanguageChanged(locale)
    }
```

### Commits de referencia

- **Commit bueno (test pasa):** `8a12d0c822eaff33dfee9eb63687ed8a4987e233` - feat(analytics): integrate Google Analytics 4 (gtag.js)
- **Commit malo (test falla):** `e2c719d4ca5511c17bb7bfcfc51004d414d3387f` - feat(analytics): implement GA4 custom events tracking (Task 9.2)

## 3. Solution Plan

**NO OBVIO** - Requiere investigación adicional para determinar la causa raíz exacta antes de implementar una solución.

### Propuestas de solución (pendientes de validación):

#### Opción A: Remover el tracking de cambio de idioma
Si el tracking no es crítico, simplemente eliminar `trackLanguageChanged` del handler.

#### Opción B: Usar `requestAnimationFrame` o `setTimeout`
Separar el tracking del cambio de idioma para evitar interferencia:
```typescript
const handleSelect = (locale: string) => {
  changeLanguage(locale as Locale)
  requestAnimationFrame(() => trackLanguageChanged(locale))
}
```

#### Opción C: Mover el tracking a un `useEffect`
En lugar de llamar al tracking en el handler, usar un efecto que detecte cambios de idioma.

## 4. Regression Tests (E2E Only)

### Test: Language selector hot reload works correctly

**Archivo:** `tests/e2e/language-selector.spec.ts`

```typescript
import { test, expect } from '../fixtures/app.fixture'

test.describe('Language Selector Hot Reload', () => {
  test('should change page language in hot reload when selecting a different language', async ({
    page,
  }) => {
    // Navigate to home page (default English)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Verify initial language is English
    await expect(page.locator('text=Simple Pricing').first()).toBeVisible({ timeout: 10000 })

    // Open language selector
    const languageButton = page.getByRole('button', { name: 'Select language' })
    await expect(languageButton).toBeVisible()
    await languageButton.click()

    // Select Spanish
    const spanishOption = page.getByRole('menuitemradio', { name: 'Español' })
    await expect(spanishOption).toBeVisible()
    await spanishOption.click()

    // Close menu
    await page.locator('body').click({ position: { x: 10, y: 10 } })

    // Verify page content changed to Spanish WITHOUT page reload
    await expect(page.locator('text=Precios Simples').first()).toBeVisible({ timeout: 5000 })
  })
})
```

- **Preconditions:** Página principal cargada en inglés
- **Steps:**
  1. Navegar a `/`
  2. Verificar texto en inglés ("Simple Pricing")
  3. Abrir selector de idioma
  4. Seleccionar "Español"
  5. Cerrar el menú
- **Expected:** El texto cambia a español ("Precios Simples") sin recargar la página

## 5. Lessons Learned

Pendiente de agregar a `docs/KNOWN_ISSUES.md` después de resolver el bug:

- **Tema:** Agregar tracking de analytics puede interferir con la reactividad de i18next
- **Prevención:** Al agregar tracking a componentes que dependen de estado global (i18n, tema, auth), verificar que no interfiera con la propagación de cambios
