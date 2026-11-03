import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './unit',
  testMatch: '**/*.test.ts',
  testIgnore: ['**/TC01_*', '**/TC05_*'],
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: 'list',
  outputDir: '../test-results/unit',
})
