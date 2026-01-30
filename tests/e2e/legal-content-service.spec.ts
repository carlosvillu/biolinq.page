import { test, expect } from '../fixtures/app.fixture'
import fs from 'node:fs'
import path from 'node:path'

test.describe('Legal Content Service', () => {
  test('Test 1: getLegalContent() loads English Terms successfully', async ({ baseURL }) => {
    const response = await fetch(`${baseURL}/api/__test__/legal?page=terms&locale=en`)

    expect(response.ok).toBe(true)

    const data = await response.json()

    // Verify response structure
    expect(data).toHaveProperty('html')
    expect(data).toHaveProperty('title')
    expect(data).toHaveProperty('description')

    // Verify content (h1 is extracted and removed from HTML since layout renders it separately)
    expect(data.html).not.toContain('<h1>')
    expect(data.html).toContain('<h2>')
    expect(data.title).toBe('Terms of Service')
    expect(data.description).toBeTruthy()
    expect(data.description.length).toBeGreaterThan(0)

    // Verify HTML is sanitized (no dangerous tags)
    expect(data.html).not.toContain('<script>')
  })

  test('Test 2: Fallback to English when Spanish file doesn\'t exist (edge case)', async ({
    baseURL
  }) => {
    // Request unsupported locale 'fr'
    const response = await fetch(`${baseURL}/api/__test__/legal?page=terms&locale=fr`)

    expect(response.ok).toBe(true)

    const data = await response.json()

    // Verify fallback to English (h1 is extracted and removed from HTML)
    expect(data.html).not.toContain('<h1>')
    expect(data.html).toContain('<h2>')
    expect(data.title).toBe('Terms of Service')
  })

  test('Test 3: Error thrown when invalid page is requested', async ({ baseURL }) => {
    // Request non-existent page (invalid page values are rejected for security)
    const response = await fetch(`${baseURL}/api/__test__/legal?page=nonexistent&locale=en`)

    expect(response.ok).toBe(false)
    expect(response.status).toBe(500)

    const data = await response.json()

    expect(data).toHaveProperty('error')
    expect(data.error).toContain('Invalid legal page: nonexistent')
  })

  test('Test 4: HTML sanitization prevents XSS', async ({ baseURL }) => {
    // Use the 'cookies' page file for this test (valid page that we can modify temporarily)
    const testDir = path.join(process.cwd(), 'content', 'legal', 'en')
    const testFile = path.join(testDir, 'cookies.md')

    // Read original content to restore later
    const originalContent = fs.existsSync(testFile) ? fs.readFileSync(testFile, 'utf-8') : null

    // Create test file with XSS attempt
    const maliciousContent = `# XSS Test

<script>alert('XSS')</script>

<p>This is a test paragraph.</p>

<img src="x" onerror="alert('XSS')">
`

    fs.writeFileSync(testFile, maliciousContent)

    try {
      const response = await fetch(`${baseURL}/api/__test__/legal?page=cookies&locale=en`)

      expect(response.ok).toBe(true)

      const data = await response.json()

      // Verify dangerous tags are removed
      expect(data.html).not.toContain('<script>')
      expect(data.html).not.toContain('onerror=')
      expect(data.html).not.toContain('alert(')

      // Verify safe HTML tags remain (h1 is removed since layout renders it)
      expect(data.html).not.toContain('<h1>')
      expect(data.html).toContain('<p>')
    } finally {
      // Restore original content
      if (originalContent !== null) {
        fs.writeFileSync(testFile, originalContent)
      } else if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile)
      }
    }
  })

  test('Test 5: Meta extraction works correctly', async ({ baseURL }) => {
    // Use the 'privacy' page file for this test (valid page that we can modify temporarily)
    const testDir = path.join(process.cwd(), 'content', 'legal', 'en')
    const testFile = path.join(testDir, 'privacy.md')

    // Read original content to restore later
    const originalContent = fs.existsSync(testFile) ? fs.readFileSync(testFile, 'utf-8') : null

    // Create test file
    const testContent = `# My Title

This is the first paragraph with some content that should be extracted as the description.

This is the second paragraph that should not be extracted.
`

    fs.writeFileSync(testFile, testContent)

    try {
      const response = await fetch(`${baseURL}/api/__test__/legal?page=privacy&locale=en`)

      expect(response.ok).toBe(true)

      const data = await response.json()

      // Verify title extraction
      expect(data.title).toBe('My Title')

      // Verify description extraction
      expect(data.description).toContain('This is the first paragraph')
      expect(data.description.length).toBeLessThanOrEqual(163) // 160 chars + "..."

      // Verify description is truncated
      expect(data.description).toContain('...')
    } finally {
      // Restore original content
      if (originalContent !== null) {
        fs.writeFileSync(testFile, originalContent)
      } else if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile)
      }
    }
  })
})
