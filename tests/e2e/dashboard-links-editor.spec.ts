import { test, expect } from '../fixtures/app.fixture'
import { createAuthSession, setAuthCookie } from '../helpers/auth'
import { seedBiolink, seedLink } from '../fixtures/seeders'

test.describe('Dashboard Links Editor', () => {
  test('user can add a new link', async ({
    page,
    context,
    baseURL,
    dbContext,
  }) => {
    // Create authenticated user
    const { token, userId } = await createAuthSession(baseURL!, {
      email: 'add-link@example.com',
      password: 'TestPassword123!',
    })

    // Create biolink
    const biolinkId = await seedBiolink(dbContext, {
      userId,
      username: 'addlinkuser',
    })

    // Set auth cookie
    await setAuthCookie(context, token)

    // Navigate to dashboard
    await page.goto('/dashboard')

    // Verify no links initially
    await expect(page.getByText('(0/5)')).toBeVisible()

    // Click "Add Link" button
    await page.getByRole('button', { name: /add link/i }).click()

    // Wait for dialog to open
    await expect(page.getByRole('heading', { name: /add new link/i })).toBeVisible()

    // Fill in link details
    await page.getByLabel(/emoji/i).fill('🐦')
    await page.getByLabel(/title/i).fill('Twitter')
    await page.getByLabel(/url/i).fill('https://twitter.com/myuser')

    // Submit form
    await page.getByRole('button', { name: /save/i }).click()

    // Wait for redirect and verify link appears
    await page.waitForURL('/dashboard')
    await expect(page.getByText('Twitter').first()).toBeVisible()
    await expect(page.getByText('twitter.com').first()).toBeVisible()
    await expect(page.getByText('🐦').first()).toBeVisible()
    await expect(page.getByText('(1/5)')).toBeVisible()
  })

  test('dialog closes after successfully adding a link', async ({
    page,
    context,
    baseURL,
    dbContext,
  }) => {
    // Create authenticated user
    const { token, userId } = await createAuthSession(baseURL!, {
      email: 'dialog-close@example.com',
      password: 'TestPassword123!',
    })

    // Create biolink
    await seedBiolink(dbContext, {
      userId,
      username: 'dialogcloseuser',
    })

    // Set auth cookie
    await setAuthCookie(context, token)

    // Navigate to dashboard
    await page.goto('/dashboard')

    // Click "Add Link" button
    await page.getByRole('button', { name: /add link/i }).click()

    // Wait for dialog to open
    await expect(page.getByRole('heading', { name: /add new link/i })).toBeVisible()

    // Fill in link details
    await page.getByLabel(/title/i).fill('Test Link')
    await page.getByLabel(/url/i).fill('https://example.com')

    // Submit form
    await page.getByRole('button', { name: /save/i }).click()

    // Wait for redirect
    await page.waitForURL('/dashboard')

    // Verify dialog is closed (heading should not be visible)
    await expect(page.getByRole('heading', { name: /add new link/i })).not.toBeVisible()

    // Verify link was created
    await expect(page.getByText('Test Link').first()).toBeVisible()
  })

  test('user can delete a link', async ({
    page,
    context,
    baseURL,
    dbContext,
  }) => {
    // Create authenticated user
    const { token, userId } = await createAuthSession(baseURL!, {
      email: 'delete-link@example.com',
      password: 'TestPassword123!',
    })

    // Create biolink
    const biolinkId = await seedBiolink(dbContext, {
      userId,
      username: 'deletelinkuser',
    })

    // Seed one link
    await seedLink(dbContext, {
      biolinkId,
      title: 'Test Link',
      url: 'https://example.com',
      position: 0,
    })

    // Set auth cookie
    await setAuthCookie(context, token)

    // Navigate to dashboard
    await page.goto('/dashboard')

    // Verify link exists
    await expect(page.getByText('Test Link').first()).toBeVisible()
    await expect(page.getByText('(1/5)')).toBeVisible()

    // Click delete button
    await page.getByRole('button', { name: /delete link/i }).click()

    // Wait for confirmation dialog
    await expect(
      page.getByRole('heading', { name: /delete link/i })
    ).toBeVisible()
    await expect(
      page.getByText(/"Test Link" will be permanently deleted/i)
    ).toBeVisible()

    // Confirm deletion
    await page.getByRole('button', { name: /^delete$/i }).click()

    // Wait for redirect and verify link is gone
    await page.waitForURL('/dashboard')
    await expect(page.getByRole('paragraph').filter({ hasText: 'Test Link' })).not.toBeVisible()
    await expect(page.getByText('(0/5)')).toBeVisible()
  })

  test('user cannot add more than 5 links', async ({
    page,
    context,
    baseURL,
    dbContext,
  }) => {
    // Create authenticated user
    const { token, userId } = await createAuthSession(baseURL!, {
      email: 'max-links@example.com',
      password: 'TestPassword123!',
    })

    // Create biolink
    const biolinkId = await seedBiolink(dbContext, {
      userId,
      username: 'maxlinksuser',
    })

    // Seed 5 links
    for (let i = 0; i < 5; i++) {
      await seedLink(dbContext, {
        biolinkId,
        title: `Link ${i + 1}`,
        url: `https://example${i + 1}.com`,
        position: i,
      })
    }

    // Set auth cookie
    await setAuthCookie(context, token)

    // Navigate to dashboard
    await page.goto('/dashboard')

    // Verify 5 links exist
    await expect(page.getByText('(5/5)')).toBeVisible()

    // Verify "Add Link" button is disabled
    const addButton = page.getByRole('button', { name: /add link/i })
    await expect(addButton).toBeDisabled()
  })

  test('cancel adding a link', async ({
    page,
    context,
    baseURL,
    dbContext,
  }) => {
    // Create authenticated user
    const { token, userId } = await createAuthSession(baseURL!, {
      email: 'cancel-add@example.com',
      password: 'TestPassword123!',
    })

    // Create biolink
    await seedBiolink(dbContext, {
      userId,
      username: 'canceladduser',
    })

    // Set auth cookie
    await setAuthCookie(context, token)

    // Navigate to dashboard
    await page.goto('/dashboard')

    // Verify no links initially
    await expect(page.getByText('(0/5)')).toBeVisible()

    // Click "Add Link" button
    await page.getByRole('button', { name: /add link/i }).click()

    // Wait for dialog
    await expect(page.getByRole('heading', { name: /add new link/i })).toBeVisible()

    // Fill some data
    await page.getByLabel(/title/i).fill('Test Link')

    // Click cancel
    await page.getByRole('button', { name: /cancel/i }).click()

    // Verify dialog closes and no link was added
    await expect(
      page.getByRole('heading', { name: /add new link/i })
    ).not.toBeVisible()
    await expect(page.getByText('(0/5)')).toBeVisible()
  })

  test('cancel deleting a link', async ({
    page,
    context,
    baseURL,
    dbContext,
  }) => {
    // Create authenticated user
    const { token, userId } = await createAuthSession(baseURL!, {
      email: 'cancel-delete@example.com',
      password: 'TestPassword123!',
    })

    // Create biolink
    const biolinkId = await seedBiolink(dbContext, {
      userId,
      username: 'canceldeleteuser',
    })

    // Seed one link
    await seedLink(dbContext, {
      biolinkId,
      title: 'Keep This Link',
      url: 'https://example.com',
      position: 0,
    })

    // Set auth cookie
    await setAuthCookie(context, token)

    // Navigate to dashboard
    await page.goto('/dashboard')

    // Verify link exists
    await expect(page.getByText('Keep This Link').first()).toBeVisible()

    // Click delete button
    await page.getByRole('button', { name: /delete link/i }).click()

    // Wait for confirmation dialog
    await expect(
      page.getByRole('heading', { name: /delete link/i })
    ).toBeVisible()

    // Click cancel
    await page.getByRole('button', { name: /cancel/i }).first().click()

    // Verify dialog closes and link still exists
    await expect(
      page.getByRole('heading', { name: /delete link/i })
    ).not.toBeVisible()
    await expect(page.getByText('Keep This Link').first()).toBeVisible()
    await expect(page.getByText('(1/5)')).toBeVisible()
  })

  test('URL validation shows error for invalid URL', async ({
    page,
    context,
    baseURL,
    dbContext,
  }) => {
    // Create authenticated user
    const { token, userId } = await createAuthSession(baseURL!, {
      email: 'invalid-url@example.com',
      password: 'TestPassword123!',
    })

    // Create biolink
    await seedBiolink(dbContext, {
      userId,
      username: 'invalidurluser',
    })

    // Set auth cookie
    await setAuthCookie(context, token)

    // Navigate to dashboard
    await page.goto('/dashboard')

    // Click "Add Link" button
    await page.getByRole('button', { name: /add link/i }).click()

    // Wait for dialog
    await expect(page.getByRole('heading', { name: /add new link/i })).toBeVisible()

    // Fill with invalid URL
    await page.getByLabel(/title/i).fill('Test')
    await page.getByLabel(/url/i).fill('not-a-url')

    // Try to submit
    await page.getByRole('button', { name: /save/i }).click()

    // HTML5 validation should prevent submission
    // The form should not close and we should still see the dialog
    await expect(page.getByRole('heading', { name: /add new link/i })).toBeVisible()

    // Verify no link was created
    await expect(page.getByText('(0/5)')).toBeVisible()
  })
})
