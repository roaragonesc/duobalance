import { randomUUID } from 'node:crypto'
import { defineConfig } from '@playwright/test'

// Each run owns a new local database; never load backend/.env or an Atlas URI.
const database = `duobalance_test_${randomUUID().replaceAll('-', '')}`
const port = 4180
process.env.DUOBALANCE_API_TEST_DATABASE = database

export default defineConfig({
  globalTeardown: './integration/apiTeardown.ts',
  testDir: './api',
  testMatch: '*.spec.ts',
  fullyParallel: true,
  workers: 1,
  projects: [{ name: 'API REST y seed' }],
  retries: 0,
  forbidOnly: true,
  timeout: 30_000,
  reporter: [
    ['list'],
    ['html', { outputFolder: '../playwright-report/api/focused', open: 'never' }],
    ['junit', { outputFile: '../test-results/api/focused/junit.xml' }],
  ],
  outputDir: `../test-results/api/artifacts/shard-${process.env.DUOBALANCE_API_SHARD ?? 'local'}`,
  use: {
    baseURL: `http://127.0.0.1:${port}/api/v1/`,
    extraHTTPHeaders: { Origin: 'http://localhost:5173' },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node --import tsx integration/runApiServer.ts',
    url: `http://127.0.0.1:${port}/api/v1/health`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      NODE_ENV: 'test',
      HOST: '127.0.0.1',
      PORT: String(port),
      FRONTEND_ORIGIN: 'http://localhost:5173',
      MONGODB_URI: 'mongodb://127.0.0.1:27018',
      MONGODB_DATABASE: database,
      MAIL_DIRECTORY: '../test-results/api/mail',
    },
  },
})
