import { test, expect } from '../fixtures'

const TERMS_PATH = '/terms'

test.describe('Terms of Service page', () => {
  test('renders English terms by default', async ({ page }) => {
    await page.goto(TERMS_PATH)

    await expect(page).toHaveTitle(/Terms of Service/)
    await expect(page.getByRole('heading', { level: 1, name: 'Terms of Service' })).toBeVisible()
    await expect(page.getByText('Acceptance of Terms')).toBeVisible()

    const card = page.locator('article')
    await expect(card).toBeVisible()
  })

  test('renders Spanish terms when lang cookie is es', async ({ page, context, baseURL }) => {
    await context.addCookies([
      {
        name: 'lang',
        value: 'es',
        url: baseURL,
        path: '/',
      },
    ])

    await page.goto(TERMS_PATH)

    await expect(page).toHaveTitle(/Términos de Servicio/)
    await expect(page.getByRole('heading', { level: 1, name: 'Términos de Servicio' })).toBeVisible()
    await expect(page.getByText('Aceptación de los Términos')).toBeVisible()
  })

  test('sets meta tags', async ({ page }) => {
    await page.goto(TERMS_PATH)

    await expect(page).toHaveTitle('Terms of Service | BioLinq')

    const description = page.locator('meta[name="description"]')
    await expect(description).toHaveAttribute('content', /.+/)
  })

  test('footer link navigates to terms page', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: /terms/i }).click()

    await expect(page).toHaveURL(TERMS_PATH)
    await expect(page.getByRole('heading', { level: 1, name: 'Terms of Service' })).toBeVisible()
  })
})
