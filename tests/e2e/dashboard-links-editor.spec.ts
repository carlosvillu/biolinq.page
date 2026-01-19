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
    await seedBiolink(dbContext, {
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

  test('user can reorder links via drag and drop', async ({
    page,
    context,
    baseURL,
    dbContext,
  }) => {
    // Create authenticated user
    const { token, userId } = await createAuthSession(baseURL!, {
      email: 'reorder-links@example.com',
      password: 'TestPassword123!',
    })

    // Create biolink
    const biolinkId = await seedBiolink(dbContext, {
      userId,
      username: 'reorderuser',
    })

    // Seed 3 links in order: A, B, C
    await seedLink(dbContext, {
      biolinkId,
      title: 'Link A',
      url: 'https://a.com',
      position: 0,
    })
    await seedLink(dbContext, {
      biolinkId,
      title: 'Link B',
      url: 'https://b.com',
      position: 1,
    })
    await seedLink(dbContext, {
      biolinkId,
      title: 'Link C',
      url: 'https://c.com',
      position: 2,
    })

    // Set auth cookie
    await setAuthCookie(context, token)

    // Navigate to dashboard
    await page.goto('/dashboard')

    // Verify initial order: A, B, C
    const linkItems = page.locator('[data-testid="link-item"]')
    await expect(linkItems).toHaveCount(3)
    await expect(linkItems.nth(0)).toContainText('Link A')
    await expect(linkItems.nth(1)).toContainText('Link B')
    await expect(linkItems.nth(2)).toContainText('Link C')

    // Verify "Save order" button is NOT visible initially
    await expect(page.getByRole('button', { name: /save order/i })).not.toBeVisible()

    // Get drag handles
    const dragHandles = page.getByRole('button', { name: /drag to reorder/i })
    await expect(dragHandles).toHaveCount(3)

    // Drag Link C to the first position using manual mouse events
    // @dnd-kit requires pointer events with distance activation (8px)
    const linkCHandle = dragHandles.nth(2)
    const linkAItem = linkItems.nth(0)

    const sourceBox = await linkCHandle.boundingBox()
    const targetBox = await linkAItem.boundingBox()

    if (sourceBox && targetBox) {
      // Start from center of drag handle
      const startX = sourceBox.x + sourceBox.width / 2
      const startY = sourceBox.y + sourceBox.height / 2
      // End above first item to trigger swap
      const endX = targetBox.x + targetBox.width / 2
      const endY = targetBox.y - 10

      await page.mouse.move(startX, startY)
      await page.mouse.down()
      // Move more than 8px to activate dnd-kit (activation constraint)
      await page.mouse.move(startX, startY - 15, { steps: 3 })
      await page.mouse.move(endX, endY, { steps: 15 })
      await page.mouse.up()
    }

    // Verify visual order changed: C, A, B
    await expect(linkItems.nth(0)).toContainText('Link C')
    await expect(linkItems.nth(1)).toContainText('Link A')
    await expect(linkItems.nth(2)).toContainText('Link B')

    // Verify "Save order" button appears
    await expect(page.getByRole('button', { name: /save order/i })).toBeVisible()

    // Click "Save order"
    await page.getByRole('button', { name: /save order/i }).click()

    // Wait for save to complete (button should disappear)
    await expect(page.getByRole('button', { name: /save order/i })).not.toBeVisible()

    // Reload page to verify persistence
    await page.reload()

    // Verify order persisted: C, A, B
    const reloadedItems = page.locator('[data-testid="link-item"]')
    await expect(reloadedItems.nth(0)).toContainText('Link C')
    await expect(reloadedItems.nth(1)).toContainText('Link A')
    await expect(reloadedItems.nth(2)).toContainText('Link B')
  })

  test('save order button only appears when order changed', async ({
    page,
    context,
    baseURL,
    dbContext,
  }) => {
    // Create authenticated user
    const { token, userId } = await createAuthSession(baseURL!, {
      email: 'save-order-visibility@example.com',
      password: 'TestPassword123!',
    })

    // Create biolink
    const biolinkId = await seedBiolink(dbContext, {
      userId,
      username: 'saveorderuser',
    })

    // Seed 2 links
    await seedLink(dbContext, {
      biolinkId,
      title: 'First Link',
      url: 'https://first.com',
      position: 0,
    })
    await seedLink(dbContext, {
      biolinkId,
      title: 'Second Link',
      url: 'https://second.com',
      position: 1,
    })

    // Set auth cookie
    await setAuthCookie(context, token)

    // Navigate to dashboard
    await page.goto('/dashboard')

    // Verify "Save order" button is NOT visible initially
    await expect(page.getByRole('button', { name: /save order/i })).not.toBeVisible()

    // Get drag handles and items
    const dragHandles = page.getByRole('button', { name: /drag to reorder/i })
    const linkItems = page.locator('[data-testid="link-item"]')

    // Helper function for drag and drop with @dnd-kit
    async function dragItem(sourceHandle: typeof dragHandles, targetItem: typeof linkItems) {
      const sourceBox = await sourceHandle.boundingBox()
      const targetBox = await targetItem.boundingBox()
      if (sourceBox && targetBox) {
        const startX = sourceBox.x + sourceBox.width / 2
        const startY = sourceBox.y + sourceBox.height / 2
        const endX = targetBox.x + targetBox.width / 2
        // Move past the target center to trigger swap
        const endY = targetBox.y + targetBox.height + 10

        await page.mouse.move(startX, startY)
        await page.mouse.down()
        await page.mouse.move(startX, startY + 15, { steps: 3 })
        await page.mouse.move(endX, endY, { steps: 15 })
        await page.mouse.up()
      }
    }

    // Drag first link to second position (swap)
    await dragItem(dragHandles.nth(0), linkItems.nth(1))

    // Verify "Save order" button IS visible
    await expect(page.getByRole('button', { name: /save order/i })).toBeVisible()

    // Drag back to original position (swap again)
    await dragItem(dragHandles.nth(0), linkItems.nth(1))

    // Verify "Save order" button is NOT visible (back to original order)
    await expect(page.getByRole('button', { name: /save order/i })).not.toBeVisible()
  })

  test('links remain draggable after adding a new link', async ({
    page,
    context,
    baseURL,
    dbContext,
  }) => {
    // Create authenticated user
    const { token, userId } = await createAuthSession(baseURL!, {
      email: 'drag-after-add@example.com',
      password: 'TestPassword123!',
    })

    // Create biolink
    const biolinkId = await seedBiolink(dbContext, {
      userId,
      username: 'dragafteradduser',
    })

    // Seed 1 link
    await seedLink(dbContext, {
      biolinkId,
      title: 'Original Link',
      url: 'https://original.com',
      position: 0,
    })

    // Set auth cookie
    await setAuthCookie(context, token)

    // Navigate to dashboard
    await page.goto('/dashboard')

    // Verify 1 link exists
    await expect(page.getByText('(1/5)')).toBeVisible()

    // Add a new link via dialog
    await page.getByRole('button', { name: /add link/i }).click()
    await expect(page.getByRole('heading', { name: /add new link/i })).toBeVisible()
    await page.getByLabel(/title/i).fill('New Link')
    await page.getByLabel(/url/i).fill('https://new.com')
    await page.getByRole('button', { name: /save/i }).click()

    // Wait for page to update (2 links now)
    await page.waitForURL('/dashboard')
    await expect(page.getByText('(2/5)')).toBeVisible()

    // Verify both links are visible
    const linkItems = page.locator('[data-testid="link-item"]')
    await expect(linkItems).toHaveCount(2)

    // Verify drag handles exist for both links
    const dragHandles = page.getByRole('button', { name: /drag to reorder/i })
    await expect(dragHandles).toHaveCount(2)

    // Drag second link above first using manual mouse events for @dnd-kit
    const sourceBox = await dragHandles.nth(1).boundingBox()
    const targetBox = await linkItems.nth(0).boundingBox()

    if (sourceBox && targetBox) {
      const startX = sourceBox.x + sourceBox.width / 2
      const startY = sourceBox.y + sourceBox.height / 2
      const endX = targetBox.x + targetBox.width / 2
      const endY = targetBox.y + 5

      await page.mouse.move(startX, startY)
      await page.mouse.down()
      await page.mouse.move(startX, startY - 10, { steps: 2 })
      await page.mouse.move(endX, endY, { steps: 10 })
      await page.mouse.up()
    }

    // Verify "Save order" button appears
    await expect(page.getByRole('button', { name: /save order/i })).toBeVisible()

    // Save order
    await page.getByRole('button', { name: /save order/i }).click()

    // Wait for redirect after save (the action redirects to /dashboard)
    await page.waitForURL('/dashboard')

    // Wait for save to complete (button should disappear after redirect)
    await expect(page.getByRole('button', { name: /save order/i })).not.toBeVisible({ timeout: 10000 })
  })

  test.skip('save order button shows spinner while saving', async ({
    page,
    context,
    baseURL,
    dbContext,
  }) => {
    // Create authenticated user
    const { token, userId } = await createAuthSession(baseURL!, {
      email: 'spinner-test@example.com',
      password: 'TestPassword123!',
    })

    // Create biolink
    const biolinkId = await seedBiolink(dbContext, {
      userId,
      username: 'spinneruser',
    })

    // Seed 2 links
    await seedLink(dbContext, {
      biolinkId,
      title: 'Link One',
      url: 'https://one.com',
      position: 0,
    })
    await seedLink(dbContext, {
      biolinkId,
      title: 'Link Two',
      url: 'https://two.com',
      position: 1,
    })

    // Set auth cookie
    await setAuthCookie(context, token)

    // Navigate to dashboard
    await page.goto('/dashboard')

    // Verify links loaded
    const linkItems = page.locator('[data-testid="link-item"]')
    await expect(linkItems).toHaveCount(2)

    // Get drag handles
    const dragHandles = page.getByRole('button', { name: /drag to reorder/i })
    await expect(dragHandles).toHaveCount(2)

    // Drag to reorder using manual mouse events for @dnd-kit
    const sourceBox = await dragHandles.nth(1).boundingBox()
    const targetBox = await linkItems.nth(0).boundingBox()

    if (sourceBox && targetBox) {
      const startX = sourceBox.x + sourceBox.width / 2
      const startY = sourceBox.y + sourceBox.height / 2
      const endX = targetBox.x + targetBox.width / 2
      // Move past the target to trigger swap
      const endY = targetBox.y - 10

      await page.mouse.move(startX, startY)
      await page.mouse.down()
      await page.mouse.move(startX, startY - 15, { steps: 3 })
      await page.mouse.move(endX, endY, { steps: 15 })
      await page.mouse.up()
    }

    // Verify "Save order" button appears after reorder
    const saveButton = page.getByRole('button', { name: /save order/i })
    await expect(saveButton).toBeVisible()

    // Click save and check for spinner or saving text
    await saveButton.click()

    // The spinner (⏳) or "Saving" text should be visible while saving
    await expect(page.locator('text=⏳').or(page.getByText(/saving/i))).toBeVisible({ timeout: 2000 })
  })
})
