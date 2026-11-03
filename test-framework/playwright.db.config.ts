import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './db',
  testMatch: '**/*.test.ts',
  globalSetup: './db/globalSetup.ts',
  fullyParallel: false,
  workers: 2,
  retries: 0,
  forbidOnly: true,
  timeout: 30_000,
  reporter: [['list']],
  outputDir: '../test-results/db',
})
