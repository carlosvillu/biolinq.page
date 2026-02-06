import { test, expect } from '../fixtures/app.fixture'

test.describe('Blog Analytics Integration', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      localStorage.setItem('biolinq_analytics_consent', 'accepted')
    })
  })

  test('blog post view triggers blog_post_viewed analytics event', async ({ page }) => {
    await page.goto('/blog/seed-post-alpha', { waitUntil: 'networkidle' })

    const blogViewedEvent = await page.evaluate(() => {
      const dataLayer = (window as unknown as { dataLayer?: unknown[] }).dataLayer
      if (!Array.isArray(dataLayer)) return null

      for (const entry of dataLayer) {
        const args = Array.from(entry as ArrayLike<unknown>)
        if (args[0] === 'event' && args[1] === 'blog_post_viewed') {
          return args[2] as Record<string, unknown>
        }
      }
      return null
    })

    expect(blogViewedEvent).not.toBeNull()
    expect(blogViewedEvent!.slug).toBe('seed-post-alpha')
    expect((blogViewedEvent!.tags as string)).toContain('link-in-bio')
  })
})
