import { test, expect } from '../fixtures/app.fixture'
import { createAuthSession, setAuthCookie } from '../helpers/auth'
import { executeSQL, resetDatabase } from '../helpers/db'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function acceptCookies(page: any) {
  const acceptButton = page.getByRole('button', { name: /accept all|aceptar todo/i })
  if (await acceptButton.isVisible().catch(() => false)) {
    await acceptButton.click()
  }
}

test.describe('Quick Feedback Feature', () => {
  test.beforeEach(async ({ dbContext }) => {
    await resetDatabase(dbContext)
  })

  test('feedback button appears on non-public pages', async ({ page }) => {
    // Navigate to dashboard (non-public page)
    await page.goto('/dashboard')

    // Verify floating feedback button is visible
    const feedbackButton = page.locator('button[aria-label="Give feedback"], button[aria-label="Dar feedback"]')
    await expect(feedbackButton).toBeVisible()
  })

  test('feedback button does NOT appear on public profile pages', async ({ page, dbContext }) => {
    // Seed a biolink for public profile
    const biolinkId = crypto.randomUUID()
    const userId = crypto.randomUUID()

    await executeSQL(
      dbContext,
      `INSERT INTO users (id, email, name) VALUES ($1, $2, $3)`,
      [userId, 'public@example.com', 'Public User']
    )

    await executeSQL(
      dbContext,
      `INSERT INTO biolinks (id, user_id, username, theme) VALUES ($1, $2, $3, $4)`,
      [biolinkId, userId, 'testuser', 'brutalist']
    )

    // Navigate to public profile page
    await page.goto('/testuser')

    // Verify floating feedback button is NOT visible
    const feedbackButton = page.locator('button[aria-label="Give feedback"], button[aria-label="Dar feedback"]')
    await expect(feedbackButton).not.toBeVisible()
  })

  test('modal opens when clicking feedback button', async ({ page }) => {
    await page.goto('/dashboard')

    // Accept cookies if banner is present
    await acceptCookies(page)

    // Click feedback button
    const feedbackButton = page.locator('button[aria-label="Give feedback"], button[aria-label="Dar feedback"]')
    await feedbackButton.click()

    // Verify modal opens with title
    const modalTitle = page.getByRole('heading', { name: /quick feedback|feedback rápido/i })
    await expect(modalTitle).toBeVisible()

    // Verify 5 emojis are present
    const emojis = ['😀', '😐', '😕', '😡', '🤯']
    for (const emoji of emojis) {
      await expect(page.getByRole('button', { name: new RegExp(emoji) })).toBeVisible()
    }
  })

  test('modal closes when clicking cancel', async ({ page }) => {
    await page.goto('/dashboard')

    // Accept cookies if banner is present
    await acceptCookies(page)

    // Open modal
    const feedbackButton = page.locator('button[aria-label="Give feedback"], button[aria-label="Dar feedback"]')
    await feedbackButton.click()

    // Verify modal is open
    const modalTitle = page.getByRole('heading', { name: /quick feedback|feedback rápido/i })
    await expect(modalTitle).toBeVisible()

    // Click cancel
    await page.getByRole('button', { name: /cancel|cancelar/i }).click()

    // Verify modal is closed
    await expect(modalTitle).not.toBeVisible()
  })

  test('emoji selection works correctly', async ({ page }) => {
    await page.goto('/dashboard')

    // Accept cookies if banner is present
    await acceptCookies(page)

    // Open modal
    const feedbackButton = page.locator('button[aria-label="Give feedback"], button[aria-label="Dar feedback"]')
    await feedbackButton.click()

    // Click on first emoji
    const emojiButtons = page.locator('button[aria-pressed]')
    await emojiButtons.first().click()

    // Verify first emoji is selected (aria-pressed="true")
    await expect(emojiButtons.first()).toHaveAttribute('aria-pressed', 'true')

    // Click on second emoji
    await emojiButtons.nth(1).click()

    // Verify second emoji is selected and first is not
    await expect(emojiButtons.nth(1)).toHaveAttribute('aria-pressed', 'true')
    await expect(emojiButtons.first()).toHaveAttribute('aria-pressed', 'false')
  })

  test('can submit feedback with emoji only', async ({ page, dbContext }) => {
    await page.goto('/dashboard')

    // Accept cookies if banner is present
    await acceptCookies(page)

    // Open modal
    const feedbackButton = page.locator('button[aria-label="Give feedback"], button[aria-label="Dar feedback"]')
    await feedbackButton.click()

    // Select first emoji
    const emojiButtons = page.locator('button[aria-pressed]')
    await emojiButtons.first().click()

    // Submit feedback
    await page.getByRole('button', { name: /send feedback|enviar feedback/i }).click()

    // Verify success toast appears
    await expect(page.getByText(/thank you for your feedback|gracias por tu feedback/i)).toBeVisible()

    // Verify feedback was saved in database
    const result = await executeSQL(dbContext, 'SELECT * FROM feedbacks')
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].emoji).toBe('😀')
    expect(result.rows[0].text).toBeNull()
  })

  test('can submit feedback with emoji and text', async ({ page, dbContext }) => {
    await page.goto('/dashboard')

    // Accept cookies if banner is present
    await acceptCookies(page)

    // Open modal
    const feedbackButton = page.locator('button[aria-label="Give feedback"], button[aria-label="Dar feedback"]')
    await feedbackButton.click()

    // Select second emoji
    const emojiButtons = page.locator('button[aria-pressed]')
    await emojiButtons.nth(1).click()

    // Add text feedback
    await page.locator('textarea').fill('Great app! Really enjoying it.')

    // Submit feedback
    await page.getByRole('button', { name: /send feedback|enviar feedback/i }).click()

    // Verify success toast appears
    await expect(page.getByText(/thank you for your feedback|gracias por tu feedback/i)).toBeVisible()

    // Verify feedback was saved in database
    const result = await executeSQL(dbContext, 'SELECT * FROM feedbacks')
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].emoji).toBe('😐')
    expect(result.rows[0].text).toBe('Great app! Really enjoying it.')
  })

  test('submit button is disabled without emoji selection', async ({ page }) => {
    await page.goto('/dashboard')

    // Accept cookies if banner is present
    await acceptCookies(page)

    // Open modal
    const feedbackButton = page.locator('button[aria-label="Give feedback"], button[aria-label="Dar feedback"]')
    await feedbackButton.click()

    // Verify submit button is disabled initially
    const submitButton = page.getByRole('button', { name: /send feedback|enviar feedback/i })
    await expect(submitButton).toBeDisabled()

    // Add text without selecting emoji
    await page.locator('textarea').fill('Some feedback text')

    // Verify submit button is still disabled
    await expect(submitButton).toBeDisabled()
  })

  test('feedback saved with user reference when logged in', async ({
    page,
    context,
    baseURL,
    dbContext,
  }) => {
    // Create authenticated user
    const { token, userId } = await createAuthSession(baseURL!, {
      email: 'feedback-user@example.com',
      password: 'TestPassword123!',
    })

    // Set auth cookie
    await setAuthCookie(context, token)

    await page.goto('/dashboard')

    // Open modal
    const feedbackButton = page.locator('button[aria-label="Give feedback"], button[aria-label="Dar feedback"]')
    await feedbackButton.click()

    // Select emoji
    const emojiButtons = page.locator('button[aria-pressed]')
    await emojiButtons.first().click()

    // Submit feedback
    await page.getByRole('button', { name: /send feedback|enviar feedback/i }).click()

    // Verify success toast
    await expect(page.getByText(/thank you for your feedback|gracias por tu feedback/i)).toBeVisible()

    // Verify feedback was saved with userId
    const result = await executeSQL(dbContext, 'SELECT * FROM feedbacks')
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].user_id).toBe(userId)
  })

  test('feedback saved without user reference when not logged in', async ({ page, dbContext }) => {
    await page.goto('/auth/login')

    // Accept cookies if banner is present
    await acceptCookies(page)

    // Open modal
    const feedbackButton = page.locator('button[aria-label="Give feedback"], button[aria-label="Dar feedback"]')
    await feedbackButton.click()

    // Select emoji
    const emojiButtons = page.locator('button[aria-pressed]')
    await emojiButtons.nth(2).click()

    // Submit feedback
    await page.getByRole('button', { name: /send feedback|enviar feedback/i }).click()

    // Verify success toast
    await expect(page.getByText(/thank you for your feedback|gracias por tu feedback/i)).toBeVisible()

    // Verify feedback was saved without userId
    const result = await executeSQL(dbContext, 'SELECT * FROM feedbacks')
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].user_id).toBeNull()
    expect(result.rows[0].emoji).toBe('😕')
  })

  test('multiple feedback submissions are allowed', async ({ page, dbContext }) => {
    await page.goto('/dashboard')

    // Accept cookies if banner is present
    await acceptCookies(page)

    // Submit first feedback
    const feedbackButton = page.locator('button[aria-label="Give feedback"], button[aria-label="Dar feedback"]')
    await feedbackButton.click()

    let emojiButtons = page.locator('button[aria-pressed]')
    await emojiButtons.first().click()
    await page.getByRole('button', { name: /send feedback|enviar feedback/i }).click()

    // Wait for success toast
    await expect(page.getByText(/thank you for your feedback|gracias por tu feedback/i)).toBeVisible()

    // Submit second feedback
    await feedbackButton.click()
    emojiButtons = page.locator('button[aria-pressed]')
    await emojiButtons.nth(1).click()
    await page.getByRole('button', { name: /send feedback|enviar feedback/i }).click()

    // Wait for success toast again
    await expect(page.getByText(/thank you for your feedback|gracias por tu feedback/i)).toBeVisible()

    // Wait for modal to close (ensures DB write completed)
    const modalTitle = page.getByRole('heading', { name: /quick feedback|feedback rápido/i })
    await expect(modalTitle).not.toBeVisible()

    // Verify both feedbacks were saved
    const result = await executeSQL(dbContext, 'SELECT * FROM feedbacks ORDER BY created_at')
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0].emoji).toBe('😀')
    expect(result.rows[1].emoji).toBe('😐')
  })

  test('feedback button appears on home page', async ({ page }) => {
    await page.goto('/')

    // Verify floating feedback button is visible on home page
    const feedbackButton = page.locator('button[aria-label="Give feedback"], button[aria-label="Dar feedback"]')
    await expect(feedbackButton).toBeVisible()
  })

  test('feedback button appears on auth pages', async ({ page }) => {
    await page.goto('/auth/login')

    // Verify floating feedback button is visible on login page
    const feedbackButton = page.locator('button[aria-label="Give feedback"], button[aria-label="Dar feedback"]')
    await expect(feedbackButton).toBeVisible()
  })
})
