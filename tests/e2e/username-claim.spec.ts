import { test, expect } from '../fixtures/app.fixture'
import { createAuthSession, setAuthCookie } from '../helpers/auth'

async function registerUsernameForUser(baseURL: string, userId: string, username: string) {
  const response = await fetch(`${baseURL}/api/__test__/username`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, username }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Failed to register username: ${response.status} - ${message}`)
  }
}

test.describe('Username claim from home', () => {
  test('shows validation error for invalid username', async ({ page }) => {
    await page.goto('/')

    await page.getByPlaceholder('username').fill('ab')

    // Wait for button to be enabled (React state update)
    const button = page.getByRole('button', { name: 'Create my BioLink' })
    await expect(button).toBeEnabled({ timeout: 5000 })
    await button.click()

    await expect(page.getByText('Username must be at least 3 characters')).toBeVisible()
  })

  test('shows error for reserved username', async ({ page }) => {
    await page.goto('/')

    await page.getByPlaceholder('username').fill('admin')

    // Wait for button to be enabled (React state update)
    const button = page.getByRole('button', { name: 'Create my BioLink' })
    await expect(button).toBeEnabled({ timeout: 5000 })
    await button.click()

    await expect(page.getByText('This username is reserved')).toBeVisible()
  })

  test('shows error for taken username', async ({ page, baseURL }) => {
    const shortId = Date.now().toString(36).slice(-6)
    const email = `test-taken-${shortId}@example.com`
    const { userId } = await createAuthSession(baseURL!, {
      email,
      password: 'TestPassword123!'
    })

    await registerUsernameForUser(baseURL!, userId, `taken${shortId}`)

    await page.goto('/')

    await page.getByPlaceholder('username').fill(`taken${shortId}`)

    // Wait for button to be enabled (React state update)
    const button = page.getByRole('button', { name: 'Create my BioLink' })
    await expect(button).toBeEnabled({ timeout: 5000 })
    await button.click()

    await expect(page.getByText('This username is already taken')).toBeVisible()
  })

  test('logged-in user can claim username and reach dashboard', async ({ page, context, baseURL }) => {
    const shortId = Date.now().toString(36).slice(-6)
    const email = `test-claim-${shortId}@example.com`
    const { token } = await createAuthSession(baseURL!, {
      email,
      password: 'TestPassword123!'
    })

    await setAuthCookie(context, token)

    await page.goto('/')

    const username = `claim${shortId}`
    await page.getByPlaceholder('username').fill(username)
    const claimButton = page.getByRole('button', { name: 'Create my BioLink' })
    await expect(claimButton).toBeEnabled({ timeout: 5000 })
    await claimButton.click()

    await page.waitForURL('**/dashboard')
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test('user with biolink is redirected to dashboard', async ({ page, context, baseURL }) => {
    const shortId = Date.now().toString(36).slice(-6)
    const email = `test-redir-${shortId}@example.com`
    const { token, userId } = await createAuthSession(baseURL!, {
      email,
      password: 'TestPassword123!'
    })

    await registerUsernameForUser(baseURL!, userId, `redir${shortId}`)
    await setAuthCookie(context, token)

    await page.goto('/')

    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
