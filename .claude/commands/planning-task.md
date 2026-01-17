---
allowed-tools: AskUserQuestion, Read, Write, Glob, Grep
argument-hint: <task-code> (e.g., 1.1, 2.3) - optional, will suggest next task if omitted
description: Plan a specific task from PLANNING.md following docs/TASK_PLANNING.md workflow
---

## Task Code

$ARGUMENTS

## Instructions

You are a senior software architect creating a detailed planning file for a specific task from PLANNING.md.

### Step 1: Read PLANNING.md

First, read the PLANNING.md file at the project root:

```
Read PLANNING.md
```

### Step 2: Identify the Task to Plan

**If a task code was provided** (e.g., "1.1", "2.3"):
- Find that specific task in PLANNING.md
- If not found, inform the user and ask for clarification

**If NO task code was provided:**
- Scan PLANNING.md for incomplete tasks (unchecked boxes `- [ ]`)
- Identify the FIRST incomplete task in the implementation order
- Use `AskUserQuestion` to confirm with the user:
  - "I found that the next incomplete task is [Task X.Y: Name]. Should I plan this task, or would you prefer a different one?"
  - Provide options: the suggested task, or let them specify another

### Step 3: Read Required Documentation

Before planning, you MUST read:

1. **Always read:** `docs/TASK_PLANNING.md` - This is the source of truth for planning structure
2. **Always read:** `docs/KNOWN_ISSUES.md` - To avoid repeating past mistakes

Then, based on the task domain, read relevant docs:
- **Auth/sessions/route protection:** `docs/AUTH.md`
- **Database/Drizzle/SQL:** `docs/DATABASE.md`
- **Deployment/env vars:** `docs/DEPLOYMENT.md`
- **Testing/Playwright:** `docs/TESTING.md`
- **I18N/translations/UI text:** `docs/I18N.md`
- **UI/UX tasks:** `docs/FRONTEND_DESIGN.md` AND `docs/STYLE_GUIDE.md`

### Step 4: Explore the Codebase

Before asking questions, understand the current state:
- Use `Glob` and `Grep` to explore relevant parts of the codebase
- Identify existing components, services, hooks that could be reused
- Understand the current implementation patterns in use
- Check `app/locales/en.json` for existing i18n keys if UI is involved

### Step 5: Information Gathering (CRITICAL)

Use `AskUserQuestion` to gather ALL necessary information. Keep asking until you have 100% clarity.

**Questions may cover:**
- Scope and boundaries of the task
- Edge cases and error handling expectations
- UI/UX details (if applicable)
- Business rules and validation requirements
- Integration with existing features
- Data flow and state management
- Security considerations
- Performance expectations
- Any ambiguities in the task description

**Rules for questioning:**
- Ask NON-OBVIOUS questions - don't ask what's already clear from PLANNING.md
- Ask follow-up questions based on user responses
- Continue until you have COMPLETE clarity
- If new questions arise from answers, ASK THEM
- Do NOT start writing the planning file until you have ALL information

### Step 6: Create the Planning File

Once you have complete clarity, create the planning file following `docs/TASK_PLANNING.md`:

**For Features:**
- File: `features/FEATURE_[TASK_CODE]_[NOMBRE_FEATURE].md`
- Include ALL required sections from TASK_PLANNING.md:
  1. Natural Language Description
  2. Technical Description
  2.1. Architecture Gate (REQUIRED)
  3. Files to Change/Create (with pseudocode)
  4. I18N Section (if UI task)
  5. E2E Test Plan

**For Bugfixes:**
- File: `bugfixes/BUGFIX_[TASK_CODE]_[NOMBRE_BUG].md`
- Follow the bugfix structure from TASK_PLANNING.md

### Step 7: STOP

**CRITICAL: After creating the planning file, STOP IMMEDIATELY.**

- Do NOT start implementing
- Do NOT write any code
- Do NOT create test files
- Do NOT run migrations
- Do NOT use TodoWrite for implementation tasks

The planning phase is COMPLETE when the file is created. Wait for explicit user approval before any implementation.

---

## Reminders

- The planning file is for an implementation model (Sonnet 4.5) to execute without ambiguity
- Pseudocode should be detailed enough that implementation is mechanical
- Architecture Gate section is MANDATORY - verify all rules are satisfied
- Each file section must include its objective and pseudocode
- E2E tests are part of the task, not a separate phase
