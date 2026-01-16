import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  // Timeout para tests que incluyen setup de TestContainers + servidor
  timeout: 120_000,
  // Fail fast: parar al primer error
  maxFailures: 1,

  use: {
    // baseURL se setea dinamicamente por fixture
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // webServer eliminado - ahora manejado por fixtures
})
