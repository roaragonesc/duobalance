import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [react()],
        test: {
          name: 'unit',
          include: ['unit/**/*.test.{ts,tsx}'],
          environment: 'jsdom',
          environmentOptions: { jsdom: { url: 'http://localhost:5173/' } },
          setupFiles: ['unit/setup.ts'],
        },
      },
      {
        test: {
          name: 'db',
          include: ['db/**/*.test.ts'],
          globalSetup: ['db/globalSetup.ts'],
          hookTimeout: 120_000,
          testTimeout: 30_000,
        },
      },
    ],
  },
})