import { test as base, expect } from '@playwright/test'
import { blockSupabaseRequests } from '../helpers/networkGuard'

export const test = base.extend<{ localRequestsOnly: void }>({
  localRequestsOnly: [
    async ({ context }, provideFixtures) => {
      const externalRequests = await blockSupabaseRequests(context)
      const sharedRequests: string[] = []
      context.on('request', (request) => {
        if (new URL(request.url()).pathname.startsWith('/__mock/')) {
          sharedRequests.push(request.url())
        }
      })
      await provideFixtures()
      expect(externalRequests).toEqual([])
      expect(sharedRequests).toEqual([])
    },
    { auto: true },
  ],
})

export { expect }
