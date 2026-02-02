# FEATURE_ADMIN_FeedbackList

## 1. Natural Language Description

### Current State
La aplicación tiene un sistema de feedback implementado que permite a cualquier usuario (autenticado o no) enviar feedback mediante un botón flotante. El feedback se almacena en la tabla `feedbacks` con emoji, texto opcional, userId (si está autenticado), username de la página visualizada, y la ruta de la página.

Sin embargo, actualmente no existe ninguna forma de visualizar los feedbacks recibidos dentro de la aplicación.

### Expected End State
Cuando el usuario con email `carlosvillu@gmail.com` acceda a la página de cuenta (`/dashboard/account`), verá una nueva sección **debajo de la Danger Zone** que muestra un listado de todos los feedbacks recibidos, ordenados de más reciente a más antiguo.

Esta sección:
- Solo es visible para el usuario con email `carlosvillu@gmail.com` (hardcoded check)
- Muestra cada feedback con: emoji, texto (si existe), fecha de creación, y opcionalmente el username de la página donde se dio el feedback
- Está ordenada por `createdAt DESC`
- No tiene paginación en esta primera versión (se asume bajo volumen de feedback)

---

## 2. Technical Description

### Approach
Se creará un servicio que consulta todos los feedbacks de la base de datos ordenados por fecha. El loader de la página de cuenta verificará si el usuario actual es el admin (`carlosvillu@gmail.com`) y, de ser así, incluirá la lista de feedbacks en los datos del loader.

Un nuevo componente `FeedbackListCard` renderizará la lista de feedbacks con el estilo Neo-Brutal consistente con el resto del dashboard.

### Architecture
- **Service layer**: Nueva función `getAllFeedbacks()` en `app/services/feedback.server.ts`
- **Loader modification**: El loader de `dashboard.account.tsx` llamará al servicio solo si el usuario es admin
- **New component**: `FeedbackListCard` en `app/components/dashboard/`
- **No changes to DB schema**: La tabla `feedbacks` ya tiene toda la información necesaria

---

## 2.1. Architecture Gate

- **Pages are puzzles:** El route module `dashboard.account.tsx` solo compone componentes existentes (`AccountInfoCard`, `DeleteAccountDialog`) y el nuevo `FeedbackListCard`. No contiene lógica de negocio.
- **Loaders/actions are thin:** El loader solo verifica auth, determina si es admin, y llama a los servicios correspondientes. Retorna datos.
- **Business logic is not in components:**
  - La consulta de feedbacks se hace en `app/services/feedback.server.ts`
  - El componente `FeedbackListCard` solo recibe datos y renderiza

### Route Module Architecture
- **`dashboard.account.tsx`**:
  - Loader: calls `getUserBiolink()`, conditionally calls `getAllFeedbacks()` if admin
  - Action: handles `deleteAccount` intent (unchanged)
  - Component: composes `AccountInfoCard`, `DeleteAccountDialog`, and conditionally `FeedbackListCard`

### Component Architecture
- **`FeedbackListCard`**: receives `feedbacks[]` prop, renders list with Neo-Brutal styling, uses `useTranslation` for i18n

---

## 3. Files to Change/Create

### `app/services/feedback.server.ts`

**Objective:** Add function to retrieve all feedbacks ordered by date descending

**Pseudocode:**
```pseudocode
FUNCTION getAllFeedbacks
  INPUT: none
  PROCESS:
    - Query database: SELECT * FROM feedbacks ORDER BY createdAt DESC
    - Return array of Feedback objects
  OUTPUT: Feedback[]
END
```

---

### `app/routes/dashboard.account.tsx`

**Objective:** Modify loader to fetch feedbacks when user is admin, render FeedbackListCard below Danger Zone

**Pseudocode:**
```pseudocode
LOADER:
  - Get authSession via getCurrentUser(request)
  - If not authenticated, redirect to /auth/login
  - Get biolink via getUserBiolink(user.id)
  - If no biolink, redirect to /

  - DEFINE isAdmin = authSession.user.email === 'carlosvillu@gmail.com'
  - IF isAdmin:
      feedbacks = await getAllFeedbacks()
  - ELSE:
      feedbacks = null

  - RETURN { accountUser, biolink, feedbacks, isAdmin }
END

COMPONENT AccountPage:
  - Destructure { accountUser, biolink, feedbacks, isAdmin } from loader data
  - Render existing structure (title, error message, AccountInfoCard)
  - Render Danger Zone section (unchanged)
  - IF isAdmin AND feedbacks:
      Render <FeedbackListCard feedbacks={feedbacks} />
END
```

---

### `app/components/dashboard/FeedbackListCard.tsx`

**Objective:** Display list of feedbacks in Neo-Brutal style card

**Pseudocode:**
```pseudocode
COMPONENT FeedbackListCard
  PROPS: feedbacks: Feedback[]

  HOOKS:
    - useTranslation() for t()

  RENDER:
    - Section with border-t-[3px] border-neo-dark (separator like Danger Zone)
    - H2 title: t('admin_feedback_title')
    - P subtitle: t('admin_feedback_subtitle') with count

    - IF feedbacks.length === 0:
        - Show empty state message
    - ELSE:
        - DIV with flex flex-col gap-4
        - FOR each feedback in feedbacks:
            - Card with Neo-Brutal styling (border-[3px], bg-white)
            - Row 1: Large emoji + relative time (e.g., "2 days ago")
            - Row 2: Feedback text (if exists) or italic "No comment"
            - Row 3: Small text with page info (if exists)
END
```

**Styling Notes:**
- Card: `bg-white border-[3px] border-neo-dark rounded p-4`
- Emoji: `text-3xl`
- Time: `text-sm text-neo-dark/60`
- Text: `text-neo-dark`
- Page info: `text-xs text-neo-dark/50`

---

## 4. I18N

### Existing keys to reuse
- None specific to this feature

### New keys to create

| Key | English | Spanish |
|-----|---------|---------|
| `admin_feedback_title` | Feedback Received | Feedback Recibido |
| `admin_feedback_subtitle` | {{count}} feedback entries | {{count}} entradas de feedback |
| `admin_feedback_empty` | No feedback received yet | Aún no hay feedback recibido |
| `admin_feedback_no_comment` | No comment provided | Sin comentario |
| `admin_feedback_from_page` | From page: {{page}} | Desde página: {{page}} |
| `admin_feedback_anonymous` | Anonymous | Anónimo |

---

## 5. E2E Test Plan

### Test: Admin user sees feedback list on account page

**Preconditions:**
- User with email `carlosvillu@gmail.com` exists and has a biolink
- At least one feedback entry exists in the database

**Steps:**
1. Login as `carlosvillu@gmail.com`
2. Navigate to `/dashboard/account`
3. Scroll to bottom of page

**Expected:**
- Section with title "Feedback Received" is visible below Danger Zone
- Feedback entries are displayed with emoji, text, and timestamp
- Entries are ordered most recent first

---

### Test: Non-admin user does not see feedback list

**Preconditions:**
- User with email different from `carlosvillu@gmail.com` exists and has a biolink
- Feedback entries exist in the database

**Steps:**
1. Login as non-admin user (e.g., `test@example.com`)
2. Navigate to `/dashboard/account`

**Expected:**
- Danger Zone section is visible
- No "Feedback Received" section appears anywhere on the page

---

### Test: Feedback list shows empty state when no feedbacks exist

**Preconditions:**
- User with email `carlosvillu@gmail.com` exists and has a biolink
- No feedback entries exist in the database (clean slate)

**Steps:**
1. Login as `carlosvillu@gmail.com`
2. Navigate to `/dashboard/account`

**Expected:**
- "Feedback Received" section is visible
- Shows empty state message: "No feedback received yet"
