import { randomUUID } from 'node:crypto'
import { defineConfig, devices } from '@playwright/test'

const database = `duobalance_test_${randomUUID().replaceAll('-', '')}`
process.env.DUOBALANCE_API_TEST_DATABASE = database

export default defineConfig({
  testDir: './web',
  testMatch: 'recorridoFinancieroApi.spec.ts',
  workers: 1, retries: 0, forbidOnly: true, timeout: 90_000,
  projects: [{ name: 'Frontend - API real (Chromium)' }],
  globalTeardown: './integration/apiTeardown.ts',
  reporter: [
    ['list'], ['html', { outputFolder: '../playwright-report/api-e2e', open: 'never' }],
    ['junit', { outputFile: '../test-results/api-e2e/junit.xml' }],
  ],
  outputDir: '../test-results/api-e2e/artifacts',
  use: {
    baseURL: 'http://127.0.0.1:4176', ...devices['Desktop Chrome'],
    serviceWorkers: 'block', trace: 'retain-on-failure', screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'node --import tsx integration/runApiServer.ts',
      url: 'http://127.0.0.1:4180/api/v1/health', reuseExistingServer: false, timeout: 180_000,
      env: {
        NODE_ENV: 'test', HOST: '127.0.0.1', PORT: '4180',
        FRONTEND_ORIGIN: 'http://127.0.0.1:4176',
        MONGODB_URI: 'mongodb://127.0.0.1:27018', MONGODB_DATABASE: database,
        MAIL_DIRECTORY: '../test-results/api-e2e/mail',
        SEED_TEST_DATA: '1',
      },
    },
    {
      command: 'npm --prefix .. run dev -- --host 127.0.0.1 --port 4176',
      url: 'http://127.0.0.1:4176', reuseExistingServer: false,
      env: { VITE_DATA_MODE: 'api', VITE_API_PROXY_TARGET: 'http://127.0.0.1:4180' },
    },
  ],
})
