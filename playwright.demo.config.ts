import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: 'pages-demo.spec.ts',
  timeout: 90_000,
  forbidOnly: true,
  reporter: 'list',
  outputDir: 'test-results/pages-demo',
  use: {
    ...devices['iPhone 13'],
    defaultBrowserType: 'chromium',
    baseURL: 'http://127.0.0.1:4175/duobalance/',
    serviceWorkers: 'block',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run preview:demo',
    url: 'http://127.0.0.1:4175/duobalance/',
    reuseExistingServer: false,
  },
})
