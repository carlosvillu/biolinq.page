# FEATURE_4.3_ThemeService.md

## ✅ IMPLEMENTATION STATUS: 100% COMPLETE

**Verificado en producción: Sin fallos ✅**

---

## 1. Natural Language Description

### Current State
- Task 4.1 (Theme Configuration) is complete: `app/lib/themes.ts` defines 4 themes (brutalist, light_minimal, dark_mode, colorful) with colors and styles
- The `biolinks` table has `theme`, `customPrimaryColor`, and `customBgColor` columns
- The `users` table has `isPremium` field to gate premium features
- No service exists to update a biolink's theme or custom colors

### Expected End State
- A new service `app/services/theme.server.ts` provides:
  - `updateBiolinkTheme(biolinkId, theme)` - Updates only the theme preset
  - `updateBiolinkColors(biolinkId, customColors)` - Updates custom colors (premium only)
  - Both functions validate inputs and return typed success/error results following project patterns

---

## 2. Technical Description

### Approach
Create a server-side service with two separate functions:
1. **updateBiolinkTheme:** Validates theme ID and updates the theme column (available to all users)
2. **updateBiolinkColors:** Validates color format, checks premium status, and updates custom color columns

### Architecture Decisions
- **Service pattern:** Follow `username.server.ts` conventions (typed results, db transactions where needed)
- **Validation:** Use Zod for color format validation
- **Premium gating:** Query user's `isPremium` status before saving custom colors

### Dependencies
- `app/db` for database access
- `app/db/schema/biolinks` for biolink table and types
- `app/db/schema/users` for premium check
- `app/lib/themes` for theme validation

---

## 2.1. Architecture Gate

- **Pages are puzzles:** This task creates only a service; no route modules involved.
- **Loaders/actions are thin:** Future routes (Task 4.4) will call this service; the service contains the business logic.
- **Business logic is not in components:** All theme update logic lives in `app/services/theme.server.ts`.

---

## 3. Files to Change/Create

### `app/services/theme.server.ts`
**Objective:** Provide a function to update a biolink's theme and optionally custom colors, with premium validation.

**Pseudocode:**
```pseudocode
IMPORTS
  db from ~/db
  biolinks, BiolinkTheme from ~/db/schema/biolinks
  users from ~/db/schema/users
  THEMES from ~/lib/themes
  eq from drizzle-orm

TYPES
  ThemeError = 'BIOLINK_NOT_FOUND' | 'INVALID_THEME'
  ColorsError = 'BIOLINK_NOT_FOUND' | 'INVALID_COLOR_FORMAT' | 'PREMIUM_REQUIRED'
  
  UpdateThemeResult = 
    | { success: true }
    | { success: false; error: ThemeError }

  UpdateColorsResult = 
    | { success: true }
    | { success: false; error: ColorsError }

  CustomColors = {
    primaryColor: string | null
    bgColor: string | null
  }

CONSTANTS
  HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/

FUNCTION isValidTheme(theme: string): boolean
  RETURN theme IN Object.keys(THEMES)
END

FUNCTION isValidHexColor(color: string | null): boolean
  IF color IS null
    RETURN true
  RETURN HEX_COLOR_REGEX.test(color)
END

// ============================================
// FUNCTION 1: Update theme only (all users)
// ============================================
FUNCTION updateBiolinkTheme(
  biolinkId: string,
  theme: BiolinkTheme
): Promise<UpdateThemeResult>
  
  // Validate theme
  IF NOT isValidTheme(theme)
    RETURN { success: false, error: 'INVALID_THEME' }
  
  // Perform update
  updateResult = UPDATE biolinks
                 SET theme = theme, updatedAt = new Date()
                 WHERE id = biolinkId
                 RETURNING id
  
  IF updateResult IS empty
    RETURN { success: false, error: 'BIOLINK_NOT_FOUND' }
  
  RETURN { success: true }
END

// ============================================
// FUNCTION 2: Update colors only (premium only)
// ============================================
FUNCTION updateBiolinkColors(
  biolinkId: string,
  customColors: CustomColors
): Promise<UpdateColorsResult>
  
  // Validate color formats
  IF NOT isValidHexColor(customColors.primaryColor)
    RETURN { success: false, error: 'INVALID_COLOR_FORMAT' }
  IF NOT isValidHexColor(customColors.bgColor)
    RETURN { success: false, error: 'INVALID_COLOR_FORMAT' }
  
  // Check if any custom color is being set (not null)
  hasCustomColors = customColors.primaryColor !== null OR customColors.bgColor !== null
  
  IF hasCustomColors
    // Fetch biolink with user to check premium status
    result = SELECT biolinks.id, users.isPremium
             FROM biolinks
             JOIN users ON biolinks.userId = users.id
             WHERE biolinks.id = biolinkId
             LIMIT 1
    
    IF result IS empty
      RETURN { success: false, error: 'BIOLINK_NOT_FOUND' }
    
    IF NOT result.isPremium
      RETURN { success: false, error: 'PREMIUM_REQUIRED' }
  
  // Perform update
  updateResult = UPDATE biolinks
                 SET customPrimaryColor = customColors.primaryColor,
                     customBgColor = customColors.bgColor,
                     updatedAt = new Date()
                 WHERE id = biolinkId
                 RETURNING id
  
  IF updateResult IS empty
    RETURN { success: false, error: 'BIOLINK_NOT_FOUND' }
  
  RETURN { success: true }
END

EXPORT 
  updateBiolinkTheme, UpdateThemeResult, ThemeError,
  updateBiolinkColors, UpdateColorsResult, ColorsError, CustomColors
```

---

## 4. I18N

This task is backend-only (service layer). No UI changes, no i18n keys needed.

---

## 5. E2E Test Plan

### updateBiolinkTheme Tests

#### Test: Any user can change theme
- **Preconditions:** User logged in, has biolink
- **Steps:**
  1. Call `updateBiolinkTheme(biolinkId, 'dark_mode')`
- **Expected:** Returns `{ success: true }`, biolink.theme = 'dark_mode' in DB

#### Test: Invalid theme returns error
- **Preconditions:** User logged in, has biolink
- **Steps:**
  1. Call `updateBiolinkTheme(biolinkId, 'invalid_theme')`
- **Expected:** Returns `{ success: false, error: 'INVALID_THEME' }`

#### Test: Non-existent biolink returns error (theme)
- **Preconditions:** User logged in
- **Steps:**
  1. Call `updateBiolinkTheme('non-existent-id', 'brutalist')`
- **Expected:** Returns `{ success: false, error: 'BIOLINK_NOT_FOUND' }`

### updateBiolinkColors Tests

#### Test: Free user cannot save custom colors
- **Preconditions:** User logged in, has biolink, is NOT premium
- **Steps:**
  1. Call `updateBiolinkColors(biolinkId, { primaryColor: '#FF0000', bgColor: null })`
- **Expected:** Returns `{ success: false, error: 'PREMIUM_REQUIRED' }`

#### Test: Premium user can save custom colors
- **Preconditions:** User logged in, has biolink, IS premium
- **Steps:**
  1. Call `updateBiolinkColors(biolinkId, { primaryColor: '#FF0000', bgColor: '#000000' })`
- **Expected:** Returns `{ success: true }`, biolink has custom colors in DB

#### Test: Premium user can clear custom colors (set to null)
- **Preconditions:** User logged in, has biolink, IS premium, has existing custom colors
- **Steps:**
  1. Call `updateBiolinkColors(biolinkId, { primaryColor: null, bgColor: null })`
- **Expected:** Returns `{ success: true }`, custom colors cleared in DB (no premium check needed for clearing)

#### Test: Invalid color format returns error
- **Preconditions:** User logged in, has biolink, IS premium
- **Steps:**
  1. Call `updateBiolinkColors(biolinkId, { primaryColor: 'not-a-color', bgColor: null })`
- **Expected:** Returns `{ success: false, error: 'INVALID_COLOR_FORMAT' }`

#### Test: Non-existent biolink returns error (colors)
- **Preconditions:** User logged in
- **Steps:**
  1. Call `updateBiolinkColors('non-existent-id', { primaryColor: '#FF0000', bgColor: null })`
- **Expected:** Returns `{ success: false, error: 'BIOLINK_NOT_FOUND' }`

---

## Notes

- Custom colors are **nullable**: passing `null` clears the custom color and reverts to theme default
- The service does NOT check if the caller owns the biolink; that authorization should happen in the route/action layer
- Task 4.4 (Integrate Theme in Dashboard) will create the route action that calls this service
