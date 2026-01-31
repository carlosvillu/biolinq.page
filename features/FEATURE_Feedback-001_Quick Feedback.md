# PLANNING_FEATURE_Feedback–001_Quick Feedback

## 1. Natural Language Description

Currently, the application does not have a mechanism for users to provide quick feedback. Users cannot easily report issues, share suggestions, or express their satisfaction with the application.

After this task, users will see a floating button in the bottom-left corner of all non-public pages (dashboard, auth, etc.). When clicked, a modal will appear where users can:

- Select one of 5 emojis to indicate quick feedback: 😀 😐 😕 😡 🤯
- Optionally add additional text in a textarea (no character limit)
- Submit feedback anonymously OR with their user reference if logged in

The feedback will be:

- Saved to the database in a new `feedbacks` table
- Tracked in GA4 analytics
- Available for review by administrators

The floating button will NOT appear on public profile pages (`:username` routes).

## 2. Technical Description

We will implement a quick feedback system with:

**Database Layer:**

- New `feedbacks` table with emoji (required), optional text, optional user reference, page context, and timestamps
- Drizzle schema definition in `app/db/schema/feedback.ts`

**API Layer:**

- POST endpoint at `/api/feedback` to receive and store feedback
- Service layer in `app/services/feedback.server.ts` for DB operations

**UI Layer:**

- Floating button component positioned fixed bottom-left
- Modal dialog with Base UI `Dialog` component
- 5 emoji selection buttons using Neo-Brutal styling
- Textarea for additional comments
- Form validation (emoji required, text optional)

**Integration:**

- Floating button added to `root.tsx` layout (excluded via logic for `:username` routes)
- GA4 event `feedback_submitted` tracked on successful submission
- User session captured from Better Auth if authenticated

**Data Flow:**

1. User clicks floating button → Modal opens
2. User selects emoji and optionally adds text
3. Form submits to `/api/feedback` via Remix action
4. Server validates emoji, saves to DB with user reference (if authenticated)
5. GA4 event fires with emoji and has_text parameter
6. Modal closes, success message shown

## 2.1. Architecture Gate

- **Pages are puzzles:** route modules (for API endpoint only) parse `request`, call service, return data/redirect.
- **Loaders/actions are thin:** API route action parses request body, validates input, calls service, returns JSON response.
- **Business logic is not in components:**
  - DB operations live in `app/services/feedback.server.ts`
  - Validation logic in Zod schema (used in action and service)
  - UI orchestration in custom hook `app/hooks/useFeedback.ts` (optional, if needed)
  - Components focus only on rendering and user interactions

## 3. Files to Change/Create

### `app/db/schema/feedback.ts` (NEW)

**Objective:** Define the feedbacks table schema for storing user feedback.

**Pseudocode:**

```pseudocode
FUNCTION defineSchema
  CREATE feedbacks TABLE
    id: UUID PRIMARY KEY DEFAULT random()
    emoji: TEXT NOT NULL (one of: 😀 😐 😕 😡 🤯)
    text: TEXT (optional, no limit)
    userId: UUID REFERENCES users.id ON DELETE SET NULL (optional)
    username: TEXT (optional, captures which username page user was viewing)
    page: TEXT (optional, captures current page path)
    createdAt: TIMESTAMP NOT NULL DEFAULT now()
  EXPORT schema and inferred types
END
```

### `app/db/schema/index.ts` (MODIFY)

**Objective:** Export the new feedback schema.

**Pseudocode:**

```pseudocode
ADD import from './feedback'
EXPORT * from './feedback'
```

### `app/services/feedback.server.ts` (NEW)

**Objective:** Handle feedback CRUD operations in the database.

**Pseudocode:**

```pseudocode
FUNCTION createFeedback(feedbackData)
  INPUT: { emoji, text?, userId?, username?, page? }
  VALIDATE: emoji is in allowed list [😀, 😐, 😕, 😡, 🤯]
  PROCESS: Insert new row in feedbacks table
  OUTPUT: Inserted feedback record
END

CONSTANT ALLOWED_EMOJIS = ["😀", "😐", "😕", "😡", "🤯"]
```

### `app/routes/api.feedback.tsx` (NEW)

**Objective:** API endpoint to receive feedback submissions.

**Pseudocode:**

```pseudocode
CONSTANT schema = ZOD_SCHEMA
  emoji: text().refine(emoji is in ALLOWED_EMOJIS, "Invalid emoji")
  text: text().optional()

FUNCTION action(request)
  PARSE request body as FormData
  VALIDATE against schema
  GET session from auth (if authenticated)
  CREATE feedback via createFeedback service
    WITH:
      emoji from request
      text from request
      userId from session (if exists)
      page from request headers (Referer)
  RETURN json success response
END
```

### `app/components/feedback/FloatingFeedbackButton.tsx` (NEW)

**Objective:** Render the floating button that triggers the feedback modal.

**Pseudocode:**

```pseudocode
COMPONENT FloatingFeedbackButton
  STATE: isOpen (boolean)

  ONCLICK: Set isOpen = true

  RENDER:
    BUTTON (fixed bottom-left)
      STYLE: Neo-Brutal with shadow layer
      ICON: Feedback icon or emoji (💬)
      HOVER: Lift animation

    IF isOpen:
      RENDER FeedbackModal
        isOpen = {isOpen}
        onClose = {() => isOpen = false}
END
```

### `app/components/feedback/FeedbackModal.tsx` (NEW)

**Objective:** Display the feedback form with emoji selection and textarea.

**Pseudocode:**

```pseudocode
COMPONENT FeedbackModal(props)
  PROPS: isOpen, onClose

  STATE:
    selectedEmoji (string | null)
    text (string)
    isSubmitting (boolean)
    error (string | null)

  HANDLERS:
    onSelectEmoji(emoji): Set selectedEmoji = emoji
    onTextChange(text): Set text = text
    onSubmit():
      VALIDATE: selectedEmoji is not null
      CALL submitFeedback(selectedEmoji, text)
      ON_SUCCESS: Call onClose, show success toast
      ON_ERROR: Set error

  RENDER:
    DIALOG (Base UI Dialog wrapper)
      HEADER: "Quick Feedback"
      BODY:
        Emoji selection grid (5 buttons)
        - Each button shows one emoji
        - Neo-Brutal styling
        - Selected emoji has different background

        Textarea
        - Placeholder: "Tell us more..."
        - Optional field
        - Neo-Brutal input styling

        Error message (if exists)

      FOOTER:
        Cancel button
        Submit button (disabled if no emoji selected)
END
```

### `app/hooks/useFeedback.ts` (NEW)

**Objective:** Handle form submission logic for feedback.

**Pseudocode:**

```pseudocode
HOOK useFeedback()
  STATE: isSubmitting, error

  FUNCTION submitFeedback(emoji, text)
    SET isSubmitting = true, error = null
    TRY:
      FETCH POST /api/feedback
        BODY: { emoji, text }
      IF response.ok:
        CALL trackFeedbackSubmitted(emoji, hasText)
        RETURN success
      ELSE:
        THROW error
    CATCH:
      SET error = errorMessage
    FINALLY:
      SET isSubmitting = false
  RETURN { submitFeedback, isSubmitting, error }
END
```

### `app/lib/analytics-events.ts` (MODIFY)

**Objective:** Add feedback tracking event.

**Pseudocode:**

```pseudocode
ADD FUNCTION trackFeedbackSubmitted(emoji: string, hasText: boolean)
  CALL gtag('event', 'feedback_submitted', {
    emoji,
    has_text: hasText
  })
END
```

### `app/hooks/useAnalytics.ts` (MODIFY)

**Objective:** Export the new feedback tracking function.

**Pseudocode:**

```pseudocode
IMPORT trackFeedbackSubmitted from analytics-events

EXPORT FUNCTION useAnalytics()
  RETURN {
    ...existing functions,
    trackFeedbackSubmitted
  }
END
```

### `app/routes/root.tsx` (MODIFY)

**Objective:** Add FloatingFeedbackButton to layout, excluding public profile pages.

**Pseudocode:**

```pseudocode
IMPORT FloatingFeedbackButton

COMPONENT Layout
  RENDER:
    Header
    Outlet
    Footer
    IF location.pathname does NOT match /:username pattern:
      FloatingFeedbackButton
END
```

## 4. I18N Section

### Existing keys to reuse

- `loading` - For submit button loading state
- Existing error keys if applicable

### New keys to create

| Key                             | English                                    | Spanish                                       |
| ------------------------------- | ------------------------------------------ | --------------------------------------------- |
| `feedback_button_aria`          | Give feedback                              | Dar feedback                                  |
| `feedback_modal_title`          | Quick Feedback                             | Feedback Rápido                               |
| `feedback_modal_subtitle`       | How was your experience?                   | ¿Cuál fue tu experiencia?                     |
| `feedback_textarea_placeholder` | Tell us more (optional)                    | Cuéntanos más (opcional)                      |
| `feedback_cancel`               | Cancel                                     | Cancelar                                      |
| `feedback_submit`               | Send Feedback                              | Enviar Feedback                               |
| `feedback_submitting`           | Sending...                                 | Enviando...                                   |
| `feedback_success`              | Thank you for your feedback!               | ¡Gracias por tu feedback!                     |
| `feedback_required_emoji`       | Please select an emoji                     | Por favor selecciona un emoji                 |
| `feedback_error`                | Failed to send feedback. Please try again. | Error al enviar feedback. Inténtalo de nuevo. |

## 5. E2E Test Plan

### Test: Feedback button appears on non-public pages

- **Preconditions:** User is on any page except `/:username` routes (e.g., `/dashboard`)
- **Steps:**
  1. Navigate to `/dashboard`
  2. Look for floating button in bottom-left corner
- **Expected:** Floating feedback button is visible in bottom-left corner

### Test: Feedback button does NOT appear on public profile pages

- **Preconditions:** User is on a public profile page
- **Steps:**
  1. Navigate to `/existing-username`
  2. Check if floating button exists
- **Expected:** Floating feedback button is NOT visible

### Test: Modal opens and closes correctly

- **Preconditions:** User is on `/dashboard`
- **Steps:**
  1. Click floating feedback button
  2. Verify modal opens with title "Quick Feedback" and 5 emojis
  3. Click cancel button or outside modal
  4. Verify modal closes
- **Expected:** Modal opens on button click, closes on cancel/outside click

### Test: Emoji selection works

- **Preconditions:** Feedback modal is open
- **Steps:**
  1. Click on 😀 emoji
  2. Verify emoji is visually selected
  3. Click on 😡 emoji
  4. Verify only 😡 is selected
- **Expected:** Only one emoji can be selected, visual feedback shows selection

### Test: Feedback submission with emoji only

- **Preconditions:** Feedback modal is open, user is authenticated
- **Steps:**
  1. Select 😀 emoji
  2. Leave textarea empty
  3. Click "Send Feedback" button
  4. Wait for submission
- **Expected:** Modal closes, success toast appears, feedback is saved in DB with emoji only

### Test: Feedback submission with emoji and text

- **Preconditions:** Feedback modal is open, user is authenticated
- **Steps:**
  1. Select 😐 emoji
  2. Type "Great app!" in textarea
  3. Click "Send Feedback" button
- **Expected:** Feedback is saved with both emoji and text, success message shown

### Test: Cannot submit without selecting emoji

- **Preconditions:** Feedback modal is open
- **Steps:**
  1. Type text in textarea without selecting emoji
  2. Try to click submit button
- **Expected:** Submit button is disabled or shows validation error

### Test: Feedback saved with user reference when logged in

- **Preconditions:** User is logged in and on `/dashboard`
- **Steps:**
  1. Select 😕 emoji
  2. Submit feedback
  3. Check database for feedback record
- **Expected:** Feedback record includes userId of authenticated user

### Test: Feedback saved without user reference when not logged in

- **Preconditions:** User is NOT logged in and on `/auth/login`
- **Steps:**
  1. Open feedback modal
  2. Select 😡 emoji
  3. Submit feedback
  4. Check database for feedback record
- **Expected:** Feedback record has userId = null (anonymous feedback)

### Test: GA4 event is fired on successful feedback

- **Preconditions:** User is logged in, GA4 consent accepted
- **Steps:**
  1. Navigate to `/dashboard`
  2. Open feedback modal
  3. Select 😀 emoji
  4. Type "Love it!" in textarea
  5. Submit feedback
  6. Check window.dataLayer for events
- **Expected:** `feedback_submitted` event appears in dataLayer with params `{ emoji: '😀', has_text: true }`

### Test: Multiple feedback submissions are allowed

- **Preconditions:** User is on `/dashboard`
- **Steps:**
  1. Submit feedback 😀
  2. Wait for success
  3. Open modal again
  4. Submit feedback 😐
  5. Check database
- **Expected:** Both feedback records are saved, no limit on submissions
