import { test as base, expect } from '@playwright/test'
import { createTestDatabase, type TestDatabase } from './testDatabase.ts'

export const test = base.extend<{ database: TestDatabase }>({
  database: [
    async ({}, use) => {
      const database = await createTestDatabase()
      try {
        await use(database)
      } finally {
        await database.drop()
      }
    },
    { timeout: 120_000 },
  ],
})

export { expect }
