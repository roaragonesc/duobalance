import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [react()],
        test: {
          name: 'unit',
          include: ['src/**/*.test.{ts,tsx}'],
          environment: 'jsdom',
          environmentOptions: { jsdom: { url: 'http://localhost:5173/' } },
          setupFiles: ['src/test/setup.ts'],
        },
      },
      {
        test: {
          name: 'db',
          include: ['supabase/tests/**/*.test.ts'],
          globalSetup: ['supabase/tests/globalSetup.ts'],
          hookTimeout: 120_000,
          testTimeout: 30_000,
        },
      },
    ],
  },
})