import { test, expect } from '../fixtures/app.fixture'
import { createAuthSession, setAuthCookie } from '../helpers/auth'
import { seedFeedback } from '../fixtures/seeders'
import { resetDatabase } from '../helpers/db'

const ADMIN_EMAIL = 'carlosvillu@gmail.com'

// Helper to create a biolink via API
async function createBiolink(
  baseURL: string,
  userId: string,
  username: string
): Promise<void> {
  const response = await fetch(`${baseURL}/api/__test__/username`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, username }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to create biolink: ${response.status} - ${text}`)
  }

  const data = await response.json()
  if (!data.success) {
    throw new Error(`Failed to create biolink: ${JSON.stringify(data)}`)
  }
}

// Helper to upgrade user to premium via API
async function upgradeToPremium(baseURL: string, userId: string): Promise<void> {
  const response = await fetch(`${baseURL}/api/__test__/premium`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, isPremium: true }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to upgrade to premium: ${response.status} - ${text}`)
  }
}

test.describe('Account Page', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard/account')
    await page.waitForURL('**/auth/login**')
    expect(page.url()).toContain('/auth/login')
  })

  test('displays user account information correctly', async ({
    page,
    context,
    baseURL,
  }) => {
    const timestamp = Date.now()
    const email = `account-test-${timestamp}@example.com`
    const password = 'TestPassword123!'
    const name = 'Test Account User'

    // Create user session
    const { token, userId } = await createAuthSession(baseURL!, {
      email,
      password,
      name,
    })
    await setAuthCookie(context, token)

    // Create biolink for user
    const username = `test${timestamp.toString().slice(-8)}`
    await createBiolink(baseURL!, userId, username)

    // Navigate to account page
    await page.goto('/dashboard/account')

    // Verify all user information is displayed
    await expect(page.locator('text=Account Settings')).toBeVisible()
    await expect(page.locator(`text=${email}`)).toBeVisible()
    await expect(page.locator(`text=${name}`)).toBeVisible()

    // Verify premium status (should be FREE)
    await expect(page.locator('text=FREE')).toBeVisible()

    // Verify biolink URL is displayed
    const bioLinkUrl = `https://biolinq.page/${username}`
    await expect(page.locator(`text=${bioLinkUrl}`)).toBeVisible()

    // Verify buttons are present
    await expect(page.locator('button:has-text("Copy URL")')).toBeVisible()
    await expect(page.locator('a:has-text("Back to Dashboard")')).toBeVisible()
    await expect(page.getByText('Delete Account', { exact: true })).toBeVisible()
  })

  test('can copy biolink URL to clipboard', async ({
    page,
    context,
    baseURL,
  }) => {
    const timestamp = Date.now()
    const email = `copy-test-${timestamp}@example.com`
    const password = 'TestPassword123!'

    // Create user session
    const { token, userId } = await createAuthSession(baseURL!, {
      email,
      password,
    })
    await setAuthCookie(context, token)

    // Create biolink
    const username = `copy${timestamp.toString().slice(-8)}`
    await createBiolink(baseURL!, userId, username)

    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    await page.goto('/dashboard/account')

    // Click copy button
    const copyButton = page.locator('button:has-text("Copy URL")')
    await copyButton.click()

    // Verify button text changes to "Copied!"
    await expect(page.locator('button:has-text("Copied!")')).toBeVisible({
      timeout: 1000,
    })

    // Verify clipboard contains the URL
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText).toBe(`https://biolinq.page/${username}`)

    // Verify button text changes back after 2 seconds
    await expect(page.locator('button:has-text("Copy URL")')).toBeVisible({
      timeout: 3000,
    })
  })

  test.skip('can copy custom domain URL for premium users', async ({
    page,
    context,
    baseURL,
  }) => {
    const timestamp = Date.now()
    const email = `premium-copy-${timestamp}@example.com`
    const password = 'TestPassword123!'

    // Create premium user session
    const { token, userId } = await createAuthSession(baseURL!, {
      email,
      password,
    })

    // Upgrade user to premium
    await upgradeToPremium(baseURL!, userId)

    await setAuthCookie(context, token)

    // Create biolink with custom domain
    const username = `prem${timestamp.toString().slice(-8)}`
    const customDomain = `link${timestamp}.example.com`
    await createBiolink(baseURL!, userId, username)

    // Set custom domain via API
    await fetch(`${baseURL}/api/__test__/custom-domain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, customDomain }),
    })

    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    await page.goto('/dashboard/account')

    // Verify PREMIUM badge is displayed
    await expect(page.locator('text=PREMIUM')).toBeVisible()

    // Click copy button
    const copyButton = page.locator('button:has-text("Copy URL")')
    await copyButton.click()

    // Verify clipboard contains the custom domain URL
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText).toBe(`https://${customDomain}`)
  })

  test('can navigate back to dashboard', async ({
    page,
    context,
    baseURL,
  }) => {
    const timestamp = Date.now()
    const email = `nav-test-${timestamp}@example.com`
    const password = 'TestPassword123!'

    // Create user session
    const { token, userId } = await createAuthSession(baseURL!, {
      email,
      password,
    })
    await setAuthCookie(context, token)

    // Create biolink
    await createBiolink(baseURL!, userId, `nav${timestamp.toString().slice(-8)}`)

    await page.goto('/dashboard/account')

    // Click "Back to Dashboard" button
    await page.locator('a:has-text("Back to Dashboard")').click()

    // Verify redirect to dashboard (not account page)
    await page.waitForURL(/\/dashboard$/)
    expect(page.url()).toMatch(/\/dashboard$/)
  })

  test('opens delete account dialog when delete button is clicked', async ({
    page,
    context,
    baseURL,
  }) => {
    const timestamp = Date.now()
    const email = `dialog-test-${timestamp}@example.com`
    const password = 'TestPassword123!'

    // Create user session
    const { token, userId } = await createAuthSession(baseURL!, {
      email,
      password,
    })
    await setAuthCookie(context, token)

    // Create biolink
    const username = `dial${timestamp.toString().slice(-8)}`
    await createBiolink(baseURL!, userId, username)

    await page.goto('/dashboard/account')

    // Wait for page to be fully loaded
    await expect(page.locator('text=Account Settings')).toBeVisible()

    // Open delete dialog
    await page.getByText('Delete Account', { exact: true }).click()

    // Verify modal opens (with extended timeout for animation)
    await expect(page.getByRole('heading', { name: 'Delete Account?' })).toBeVisible({ timeout: 10000 })
    await expect(
      page.getByText('This action cannot be undone. All your data, links, and stats will be permanently deleted.')
    ).toBeVisible()

    // Verify input field is present
    await expect(
      page.locator('input[placeholder*="Type your username"]')
    ).toBeVisible()

    // Verify buttons
    await expect(page.getByText('Cancel', { exact: true })).toBeVisible()
    await expect(page.getByText('Delete My Account', { exact: true })).toBeVisible()
  })

  test('delete button is disabled until correct username is entered', async ({
    page,
    context,
    baseURL,
  }) => {
    const timestamp = Date.now()
    const email = `validation-test-${timestamp}@example.com`
    const password = 'TestPassword123!'

    // Create user session
    const { token, userId } = await createAuthSession(baseURL!, {
      email,
      password,
    })
    await setAuthCookie(context, token)

    // Create biolink
    const username = `val${timestamp.toString().slice(-8)}`
    await createBiolink(baseURL!, userId, username)

    await page.goto('/dashboard/account')

    // Open delete dialog
    await page.getByText('Delete Account', { exact: true }).click()

    // Verify delete button is disabled initially
    const deleteButton = page.locator('button:has-text("Delete My Account")')
    await expect(deleteButton).toBeDisabled()

    // Type incorrect username
    const input = page.locator('input[placeholder*="Type your username"]')
    await input.fill('wrongusername')

    // Verify delete button is still disabled
    await expect(deleteButton).toBeDisabled()

    // Type correct username
    await input.clear()
    await input.fill(username)

    // Verify delete button is now enabled
    await expect(deleteButton).toBeEnabled()
  })

  test('can cancel account deletion', async ({
    page,
    context,
    baseURL,
  }) => {
    const timestamp = Date.now()
    const email = `cancel-test-${timestamp}@example.com`
    const password = 'TestPassword123!'

    // Create user session
    const { token, userId } = await createAuthSession(baseURL!, {
      email,
      password,
    })
    await setAuthCookie(context, token)

    // Create biolink
    await createBiolink(baseURL!, userId, `can${timestamp.toString().slice(-8)}`)

    await page.goto('/dashboard/account')

    // Open delete dialog
    await page.getByText('Delete Account', { exact: true }).click()

    // Click Cancel button
    await page.getByText('Cancel', { exact: true }).click()

    // Verify modal closes
    await expect(page.locator('text=Delete Account?')).not.toBeVisible()

    // Verify still on account page
    await expect(page.locator('text=Account Settings')).toBeVisible()

    // Verify user can still access dashboard (account not deleted)
    await page.goto('/dashboard')
    await expect(page.locator('text=Total Views')).toBeVisible()
  })

  test('successfully deletes account with confirmation', async ({
    page,
    context,
    baseURL,
  }) => {
    const timestamp = Date.now()
    const email = `delete-success-${timestamp}@example.com`
    const password = 'TestPassword123!'

    // Create user session
    const { token, userId } = await createAuthSession(baseURL!, {
      email,
      password,
    })
    await setAuthCookie(context, token)

    // Create biolink
    const username = `del${timestamp.toString().slice(-8)}`
    await createBiolink(baseURL!, userId, username)

    await page.goto('/dashboard/account')

    // Open delete dialog
    await page.getByText('Delete Account', { exact: true }).click()

    // Type username
    const input = page.locator('input[placeholder*="Type your username"]')
    await input.fill(username)

    // Click delete button
    await page.locator('button:has-text("Delete My Account")').click()

    // Verify redirect to landing page
    await page.waitForURL('/')
    expect(page.url()).toBe(`${baseURL}/`)

    // Verify header shows login button, NOT the user dropdown
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible()
    await expect(page.locator('button[aria-label="User menu"]')).not.toBeVisible()

    // Verify user is signed out (can't access dashboard)
    await page.goto('/dashboard')
    await page.waitForURL('**/auth/login**')
    expect(page.url()).toContain('/auth/login')

    // Verify biolink is deleted (username is available)
    await page.goto(`/${username}`)
    await expect(page.locator('text=Profile not found')).toBeVisible()
  })

  test('can access account page from user dropdown', async ({
    page,
    context,
    baseURL,
  }) => {
    const timestamp = Date.now()
    const email = `dropdown-test-${timestamp}@example.com`
    const password = 'TestPassword123!'

    // Create user session
    const { token, userId } = await createAuthSession(baseURL!, {
      email,
      password,
    })
    await setAuthCookie(context, token)

    // Create biolink
    await createBiolink(baseURL!, userId, `drp${timestamp.toString().slice(-8)}`)

    await page.goto('/dashboard')

    // Click user dropdown (the aria-label is on the div inside the trigger)
    await page.locator('[aria-label="User menu"]').click()

    // Click Account link
    await page.getByRole('menuitem', { name: /account/i }).click()

    // Verify redirect to account page
    await page.waitForURL('**/dashboard/account')
    expect(page.url()).toContain('/dashboard/account')
  })

  test.describe('Admin Feedback List', () => {
    test('admin user sees feedback list on account page', async ({
      page,
      context,
      baseURL,
      dbContext,
    }) => {
      await resetDatabase(dbContext)

      // Create admin user session
      const { token, userId } = await createAuthSession(baseURL!, {
        email: ADMIN_EMAIL,
        password: 'TestPassword123!',
        name: 'Admin User',
      })
      await setAuthCookie(context, token)

      // Create biolink for admin
      const username = `admin${Date.now().toString().slice(-8)}`
      await createBiolink(baseURL!, userId, username)

      // Seed some feedbacks
      await seedFeedback(dbContext, {
        emoji: '😀',
        text: 'Great app!',
        username: 'testuser1',
        page: '/testuser1',
      })
      await seedFeedback(dbContext, {
        emoji: '😐',
        text: null,
        username: 'testuser2',
        page: '/testuser2',
      })
      await seedFeedback(dbContext, {
        emoji: '😕',
        text: 'Could be better',
        username: null,
        page: '/',
      })

      // Navigate to account page
      await page.goto('/dashboard/account')

      // Scroll to bottom of page
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

      // Verify feedback section is visible
      await expect(page.getByRole('heading', { name: 'Feedback Received' })).toBeVisible()
      await expect(page.getByText('3 feedback entries')).toBeVisible()

      // Verify feedback entries are displayed
      await expect(page.getByText('Great app!')).toBeVisible()
      await expect(page.getByText('Could be better')).toBeVisible()
      await expect(page.getByText('No comment provided')).toBeVisible()

      // Verify page info is shown
      await expect(page.getByText('From page: /testuser1')).toBeVisible()
    })

    test('non-admin user does not see feedback list', async ({
      page,
      context,
      baseURL,
      dbContext,
    }) => {
      await resetDatabase(dbContext)

      const timestamp = Date.now()
      const email = `nonadmin-${timestamp}@example.com`

      // Create non-admin user session
      const { token, userId } = await createAuthSession(baseURL!, {
        email,
        password: 'TestPassword123!',
        name: 'Regular User',
      })
      await setAuthCookie(context, token)

      // Create biolink for user
      const username = `user${timestamp.toString().slice(-8)}`
      await createBiolink(baseURL!, userId, username)

      // Seed some feedbacks
      await seedFeedback(dbContext, {
        emoji: '😀',
        text: 'Great app!',
        username: 'testuser1',
        page: '/testuser1',
      })

      // Navigate to account page
      await page.goto('/dashboard/account')

      // Verify Danger Zone is visible
      await expect(page.getByText('Danger Zone')).toBeVisible()

      // Verify feedback section is NOT visible
      await expect(page.getByRole('heading', { name: 'Feedback Received' })).not.toBeVisible()
    })

    test('feedback list shows empty state when no feedbacks exist', async ({
      page,
      context,
      baseURL,
      dbContext,
    }) => {
      await resetDatabase(dbContext)

      // Create admin user session
      const { token, userId } = await createAuthSession(baseURL!, {
        email: ADMIN_EMAIL,
        password: 'TestPassword123!',
        name: 'Admin User',
      })
      await setAuthCookie(context, token)

      // Create biolink for admin
      const username = `admin${Date.now().toString().slice(-8)}`
      await createBiolink(baseURL!, userId, username)

      // Navigate to account page (no feedbacks seeded)
      await page.goto('/dashboard/account')

      // Scroll to bottom of page
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

      // Verify feedback section is visible with empty state
      await expect(page.getByRole('heading', { name: 'Feedback Received' })).toBeVisible()
      await expect(page.getByText('0 feedback entries')).toBeVisible()
      await expect(page.getByText('No feedback received yet')).toBeVisible()
    })
  })
})
