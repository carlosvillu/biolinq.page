import { test, expect } from '../fixtures/app.fixture'

test.describe('Blog Content Service', () => {
  test('getBlogPost returns a valid blog post', async ({ baseURL }) => {
    const response = await fetch(
      `${baseURL}/api/__test__/blog?action=getPost&slug=seed-post-alpha&locale=en`
    )

    expect(response.ok).toBe(true)

    const data = await response.json()

    expect(data).toHaveProperty('html')
    expect(data).toHaveProperty('meta')
    expect(data.meta.title).toBeTruthy()
    expect(data.meta.slug).toBe('seed-post-alpha')
    expect(data.meta.tags).toContain('link-in-bio')
    expect(data.meta.tags).toContain('personal-branding')
    expect(data.meta.readingTime).toBe(5)
    expect(data.html).toContain('<h2>')
    expect(data.html).not.toContain('<script>')
  })

  test('getBlogPost returns null for non-existent slug', async ({ baseURL }) => {
    const response = await fetch(
      `${baseURL}/api/__test__/blog?action=getPost&slug=non-existent-post&locale=en`
    )

    expect(response.ok).toBe(true)

    const data = await response.json()

    expect(data).toBeNull()
  })

  test('getBlogPost falls back to English when locale file missing', async ({ baseURL }) => {
    const response = await fetch(
      `${baseURL}/api/__test__/blog?action=getPost&slug=seed-post-beta&locale=es`
    )

    expect(response.ok).toBe(true)

    const data = await response.json()

    expect(data).toHaveProperty('html')
    expect(data).toHaveProperty('meta')
    expect(data.meta.slug).toBe('seed-post-beta')
    // English content served as fallback
    expect(data.meta.title).toContain('Beta Post')
  })

  test('getBlogPost returns Spanish version when available', async ({ baseURL }) => {
    const response = await fetch(
      `${baseURL}/api/__test__/blog?action=getPost&slug=seed-post-alpha&locale=es`
    )

    expect(response.ok).toBe(true)

    const data = await response.json()

    expect(data).toHaveProperty('html')
    expect(data).toHaveProperty('meta')
    expect(data.meta.slug).toBe('seed-post-alpha')
    // Spanish content
    expect(data.meta.author).toBe('Autor de Prueba')
  })

  test('getAllBlogPosts returns posts sorted by date descending', async ({ baseURL }) => {
    const response = await fetch(`${baseURL}/api/__test__/blog?action=getAll&locale=en`)

    expect(response.ok).toBe(true)

    const data = (await response.json()) as Array<{ slug: string; date: string }>

    // Should have 3 valid posts (invalid is excluded)
    expect(data.length).toBe(3)

    // Sorted by date descending: gamma (Jan 25) → beta (Jan 20) → alpha (Jan 15)
    expect(data[0].slug).toBe('seed-post-gamma')
    expect(data[1].slug).toBe('seed-post-beta')
    expect(data[2].slug).toBe('seed-post-alpha')
  })

  test('getRelatedPosts excludes current post and matches by tags', async ({ baseURL }) => {
    const response = await fetch(
      `${baseURL}/api/__test__/blog?action=getRelated&slug=seed-post-alpha&tags=link-in-bio,personal-branding&locale=en&limit=3`
    )

    expect(response.ok).toBe(true)

    const data = (await response.json()) as Array<{ slug: string }>

    // Should NOT contain alpha (current post)
    expect(data.find((p) => p.slug === 'seed-post-alpha')).toBeUndefined()

    // Beta shares "link-in-bio" tag, should be first
    expect(data[0].slug).toBe('seed-post-beta')
  })

  test('frontmatter validation rejects invalid posts', async ({ baseURL }) => {
    const response = await fetch(`${baseURL}/api/__test__/blog?action=getAll&locale=en`)

    expect(response.ok).toBe(true)

    const data = (await response.json()) as Array<{ slug: string }>

    // Only 3 valid posts; invalid post is silently excluded
    expect(data.length).toBe(3)
    expect(data.find((p) => p.slug === 'seed-post-invalid')).toBeUndefined()
  })
})
