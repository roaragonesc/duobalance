import { randomUUID } from 'node:crypto'
import { readdir, readFile, unlink } from 'node:fs/promises'
import { resolve } from 'node:path'
import { test as base, expect } from '@playwright/test'

export const test = base.extend<{
  apiIsolation: void
  account: { email: string; name: string; password: string }
  mailToken: (subject: string) => Promise<string>
}>({
  apiIsolation: [
    async ({ baseURL }, provideFixtures) => {
      if (baseURL !== 'http://127.0.0.1:4180/api/v1/') {
        throw new Error('Tests API bloqueados: solo se permite el servidor local aislado en 4180.')
      }
      await provideFixtures()
    },
    { auto: true },
  ],
  account: async ({ request: _request }, provideFixtures) => {
    await provideFixtures({ email: `api-${randomUUID()}@duobalance.test`, name: 'Cuenta API', password: 'Pruebas1234!' })
  },
  mailToken: async ({ account }, provideFixtures) => {
    // Both the repository-root and backend working directories resolve to this folder.
    const directory = resolve(import.meta.dirname, '../../test-results/api/mail')
    const ownedFiles = new Set<string>()
    await provideFixtures(async (subject) => {
      for (const filename of await readdir(directory)) {
        const path = resolve(directory, filename)
        const mail: unknown = JSON.parse(await readFile(path, 'utf8'))
        if (typeof mail === 'object' && mail !== null && 'to' in mail &&
            mail.to === account.email && 'subject' in mail && mail.subject === subject &&
            'text' in mail && typeof mail.text === 'string') {
          ownedFiles.add(path)
          const value = mail.text.match(/[a-f0-9]{64}/)?.[0]
          if (value) return value
        }
      }
      throw new Error('No se ha encontrado el correo local esperado para este test.')
    })
    for (const path of ownedFiles) await unlink(path)
  },
})

export { expect }
