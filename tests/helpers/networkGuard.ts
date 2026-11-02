import type { Page } from '@playwright/test'

export async function blockSupabaseRequests(page: Page): Promise<string[]> {
  const requests: string[] = []

  await page.route('**/*', async (route) => {
    const requestUrl = new URL(route.request().url())
    if (requestUrl.hostname.endsWith('.supabase.co') || requestUrl.port === '54321') {
      requests.push(requestUrl.toString())
      await route.abort()
      return
    }
    await route.continue()
  })

  return requests
}
