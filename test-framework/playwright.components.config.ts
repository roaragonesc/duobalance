import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/experimental-ct-react'

const resolve = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  testDir: './unit',
  testMatch: ['**/*.test.tsx', '**/TC01_*.test.ts', '**/TC05_*.test.ts'],
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: 'list',
  outputDir: '../test-results/components',
  use: {
    ...devices['Desktop Chrome'],
    ctPort: 3100,
    ctTemplateDir: './unit/support/playwright',
    ctViteConfig: {
      resolve: {
        alias: [
          { find: /.*\/features\/auth\/services\/authService$/, replacement: resolve('./unit/support/authService.ts') },
          { find: /.*\/features\/spaces\/services\/spaceService$/, replacement: resolve('./unit/support/spaceService.ts') },
          { find: /.*\/lib\/supabase\/client$/, replacement: resolve('./unit/support/supabaseClient.ts') },
        ],
      },
    },
  },
})
