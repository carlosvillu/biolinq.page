import { test, expect } from '../fixtures/app.fixture'

test.describe('Language Selector Hot Reload', () => {
  test('should change UI text immediately when switching from English to Spanish', async ({
    page,
  }) => {
    await page.goto('/')

    // Verify initial English content
    const loginButton = page.getByRole('link', { name: 'Login' })
    await expect(loginButton).toBeVisible()

    // Click language selector (globe icon)
    const languageSelector = page.getByRole('button', { name: 'Select language' })
    await languageSelector.click()

    // Select Spanish
    await page.getByRole('menuitemradio', { name: 'Español' }).click()

    // Without page reload, verify text changed to Spanish
    await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible()
  })

  test('should change UI text immediately when switching from Spanish to English', async ({
    page,
    context,
  }) => {
    // Set Spanish cookie before navigation
    await context.addCookies([
      {
        name: 'lang',
        value: 'es',
        domain: 'localhost',
        path: '/',
      },
    ])

    await page.goto('/')

    // Verify initial Spanish content
    await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible()

    // Click language selector
    const languageSelector = page.getByRole('button', { name: 'Select language' })
    await languageSelector.click()

    // Select English
    await page.getByRole('menuitemradio', { name: 'English' }).click()

    // Without page reload, verify text changed to English
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible()
  })

  test('should set cookie correctly when changing language', async ({ page, context }) => {
    await page.goto('/')

    // Change to Spanish
    await page.getByRole('button', { name: 'Select language' }).click()
    await page.getByRole('menuitemradio', { name: 'Español' }).click()

    // Wait for revalidation to complete (Spanish text appears)
    await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible()

    // Verify Spanish cookie is set
    let cookies = await context.cookies()
    let langCookie = cookies.find((c) => c.name === 'lang')
    expect(langCookie?.value).toBe('es')

    // Close menu by pressing Escape and wait for it to close
    await page.keyboard.press('Escape')
    await expect(page.getByRole('menuitemradio', { name: 'English' })).not.toBeVisible()

    // Change to English
    await page.getByRole('button', { name: 'Select language' }).click()
    await page.getByRole('menuitemradio', { name: 'English' }).click()

    // Wait for revalidation to complete (English text appears)
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible()

    // Verify English cookie is set
    cookies = await context.cookies()
    langCookie = cookies.find((c) => c.name === 'lang')
    expect(langCookie?.value).toBe('en')
  })
})
