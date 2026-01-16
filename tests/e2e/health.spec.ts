import { test, expect } from '../fixtures/app.fixture'

test.describe('Health Check', () => {
  test('GET /health/db should return ok', async ({ baseURL }) => {
    const response = await fetch(`${baseURL}/health/db`)

    expect(response.ok).toBe(true)

    const text = await response.text()
    expect(text).toBe('ok')
  })
})
