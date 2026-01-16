import { test as base } from '@playwright/test'
import { spawn, type ChildProcess } from 'child_process'
import {
  startPostgresContainer,
  stopPostgresContainer,
  type DbContext,
} from '../helpers/db'
import { createAuthSchema } from './seeders'

type AppWorkerFixtures = {
  dbContext: DbContext
  appServer: { port: number; process: ChildProcess }
}

// Regex para limpiar ANSI escape codes del output del servidor
// eslint-disable-next-line no-control-regex
const ANSI_REGEX = /\x1B\[[0-9;]*[a-zA-Z]/g

export const test = base.extend<object, AppWorkerFixtures>({
  // Worker-scoped: contenedor TestContainers PostgreSQL
  dbContext: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const ctx = await startPostgresContainer()

      await createAuthSchema(ctx)

      await use(ctx)

      await stopPostgresContainer(ctx)
    },
    { scope: 'worker' },
  ],

  // Worker-scoped: servidor React Router con DB_TEST_URL apuntando al contenedor
  appServer: [
    async ({ dbContext }, use, workerInfo) => {
      const requestedPort = 4000 + workerInfo.workerIndex

      const serverProcess = spawn('npx', ['react-router', 'dev', '--port', String(requestedPort)], {
        env: { ...process.env, DB_TEST_URL: dbContext.connectionString },
        cwd: process.cwd(),
        stdio: 'pipe',
        shell: true,
        detached: true,
      })

      // Detectar puerto real (React Router puede usar otro si el solicitado está ocupado)
      const detectedPort = await detectServerPort(serverProcess, 30000)

      await waitForHealthCheck(`http://localhost:${detectedPort}/health/db`, 60000)

      await use({ port: detectedPort, process: serverProcess })

      // Cleanup: matar grupo de procesos completo
      if (serverProcess.pid) {
        try {
          process.kill(-serverProcess.pid, 'SIGTERM')
        } catch {
          // Proceso ya terminó
        }
      }
      await new Promise<void>((resolve) => {
        serverProcess.on('exit', () => resolve())
        setTimeout(resolve, 3000)
      })
    },
    { scope: 'worker' },
  ],

  // baseURL dinámico basado en el puerto del servidor del worker
  baseURL: async ({ appServer }, use) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- Playwright fixture, not React hook
    await use(`http://localhost:${appServer.port}`)
  },
})

/**
 * Detecta el puerto real donde el servidor está escuchando parseando stdout.
 * React Router puede usar un puerto diferente si el solicitado está ocupado.
 */
async function detectServerPort(serverProcess: ChildProcess, timeout: number): Promise<number> {
  return new Promise((resolve, reject) => {
    let resolved = false
    const timer = setTimeout(() => {
      if (!resolved) reject(new Error(`Timeout detecting server port (${timeout}ms)`))
    }, timeout)

    const cleanup = () => {
      resolved = true
      clearTimeout(timer)
    }

    serverProcess.stdout?.on('data', (data: Buffer) => {
      if (resolved) return
      const clean = data.toString().replace(ANSI_REGEX, '')
      const match = clean.match(/localhost:(\d+)/)
      if (match) {
        cleanup()
        resolve(parseInt(match[1], 10))
      }
    })

    serverProcess.on('error', (err) => {
      if (!resolved) {
        cleanup()
        reject(err)
      }
    })

    serverProcess.on('exit', (code) => {
      if (!resolved && code !== 0) {
        cleanup()
        reject(new Error(`Server exited with code ${code}`))
      }
    })
  })
}

/**
 * Espera a que el health check responda OK.
 */
async function waitForHealthCheck(url: string, timeout: number): Promise<void> {
  const start = Date.now()
  let lastError = ''

  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url)
      if (res.ok) return
      lastError = `Status ${res.status}`
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'Unknown error'
    }
    await new Promise((r) => setTimeout(r, 1000))
  }

  throw new Error(`Health check timeout (${timeout}ms): ${url} - ${lastError}`)
}

export { expect } from '@playwright/test'
