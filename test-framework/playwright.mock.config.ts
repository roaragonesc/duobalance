import { defineConfig, devices } from '@playwright/test'

const port = 4174
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './web',
  testIgnore: [
    'demoMovil.spec.ts',
    'confirmacionYRecuperacionDemo.spec.ts',
    'recorridoFinancieroApi.spec.ts',
  ],
  fullyParallel: true,
  timeout: 90_000,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: '../playwright-report/mock', open: 'never' }],
    ['junit', { outputFile: '../test-results/junit.xml' }],
  ],
  outputDir: '../test-results/artifacts',
  use: {
    baseURL,
    serviceWorkers: 'block',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Frontend - Mock (Chromium)',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm --prefix .. run dev:mock -- --host 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 30_000,
    env: { ...process.env, VITE_DATA_MODE: 'mock', VITE_MOCK_SHARED: '1' },
  },
})
