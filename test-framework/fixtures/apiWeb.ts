import { readdir, readFile, unlink } from 'node:fs/promises'
import { resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { test as base, expect, type Page } from '@playwright/test'
import { blockSupabaseRequests } from '../helpers/networkGuard'

export const test = base.extend<{
  partnerPage: Page
  users: { a: { name: string; email: string; password: string }; b: { name: string; email: string; password: string } }
  confirmationUrl: (email: string) => Promise<string>
  apiNetworkGuard: void
}>({
  users: async ({ page: _page }, provideFixtures) => {
    const suffix = randomUUID()
    await provideFixtures({
      a: { name: 'Ana', email: `ana-${suffix}@duobalance.test`, password: 'Pruebas1234!' },
      b: { name: 'Luis', email: `luis-${suffix}@duobalance.test`, password: 'Pruebas1234!' },
    })
  },
  apiNetworkGuard: [
    async ({ context, baseURL }, provideFixtures) => {
      if (baseURL !== 'http://127.0.0.1:4176') throw new Error('El E2E API necesita el entorno aislado en 4176.')
      const requests = await blockSupabaseRequests(context)
      await provideFixtures()
      expect(requests).toEqual([])
    }, { auto: true },
  ],
  partnerPage: async ({ browser, baseURL }, provideFixtures) => {
    const context = await browser.newContext({ baseURL, serviceWorkers: 'block' })
    const requests = await blockSupabaseRequests(context)
    try {
      await provideFixtures(await context.newPage())
      expect(requests).toEqual([])
    } finally { await context.close() }
  },
  confirmationUrl: async ({ baseURL }, provideFixtures) => {
    const directory = resolve(import.meta.dirname, '../../test-results/api-e2e/mail')
    const owned = new Set<string>()
    try {
      await provideFixtures(async (email) => {
        for (const filename of await readdir(directory)) {
          const path = resolve(directory, filename)
          const mail = JSON.parse(await readFile(path, 'utf8'))
          if (mail.to === email) {
            owned.add(path)
            const token = typeof mail.text === 'string' ? mail.text.match(/[a-f0-9]{64}/)?.[0] : undefined
            if (token) return `${baseURL}/auth/callback?token_hash=${token}&type=signup`
          }
        }
        throw new Error('No existe el correo de confirmación esperado.')
      })
    } finally { for (const path of owned) await unlink(path) }
  },
})
export { expect }
