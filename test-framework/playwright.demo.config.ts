import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './web',
  testMatch: [
    'demoMovil.spec.ts',
    'confirmacionYRecuperacionDemo.spec.ts',
  ],
  timeout: 90_000,
  forbidOnly: true,
  projects: [{ name: 'Frontend - Demo movil (Chromium)' }],
  reporter: 'list',
  outputDir: '../test-results/pages-demo',
  use: {
    ...devices['iPhone 13'],
    defaultBrowserType: 'chromium',
    baseURL: 'http://127.0.0.1:4175/duobalance/',
    serviceWorkers: 'block',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm --prefix .. run preview:demo',
    url: 'http://127.0.0.1:4175/duobalance/',
    reuseExistingServer: false,
  },
})
