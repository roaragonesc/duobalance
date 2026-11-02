import type { BrowserContext, Page } from '@playwright/test'

export async function blockSupabaseRequests(page: Page | BrowserContext): Promise<string[]> {
  const requests: string[] = []

  await page.route('**/*', async (route) => {
    const requestUrl = new URL(route.request().url())
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(requestUrl.hostname) ||
        requestUrl.port === '54321') {
      requests.push(requestUrl.toString())
      await route.abort()
      return
    }
    await route.continue()
  })

  return requests
}
