import { expect, test as base, type Page } from '@playwright/test'
import { DemoPanel } from '../components/DemoPanel'
import { DemoScenarios } from '../helpers/demoScenarios'
import { blockSupabaseRequests } from '../helpers/networkGuard'
import { ExpensesPage } from '../pages/ExpensesPage'
import { LoginPage } from '../pages/LoginPage'
import { OnboardingPage } from '../pages/OnboardingPage'
import { ProfilePage } from '../pages/ProfilePage'
import { registerUser, prepareSharedSpace } from '../helpers/sharedSpace'
import { journeyUsers } from '../data/journeyUsers'

type E2EFixtures = {
  demoPanel: DemoPanel
  scenarios: DemoScenarios
  loginPage: LoginPage
  onboardingPage: OnboardingPage
  profilePage: ProfilePage
  expensesPage: ExpensesPage
  supabaseRequests: string[]
  resetMockData: void
  mockScenario: string
  partnerPage: Page
  anaAccount: void
  couple: void
}

export const test = base.extend<E2EFixtures>({
  anaAccount: async ({ page, demoPanel, resetMockData: _reset }, provideFixtures) => {
    await registerUser(page, journeyUsers.a)
    await demoPanel.selectUser(null)
    await provideFixtures()
  },
  couple: async ({ page, partnerPage, resetMockData: _reset }, provideFixtures) => {
    await prepareSharedSpace(page, partnerPage)
    await provideFixtures()
  },
  mockScenario: async ({ request }, provideFixtures) => {
    const response = await request.post('/__mock/scenarios')
    expect(response.status()).toBe(201)
    const body: unknown = await response.json()
    if (typeof body !== 'object' || body === null || !('id' in body) || typeof body.id !== 'string') {
      throw new Error('No se pudo crear el escenario mock.')
    }
    await provideFixtures(body.id)
    const cleanup = await request.delete('/__mock/scenario', {
      headers: { Cookie: `duobalance-scenario=${body.id}` },
    })
    expect(cleanup.status()).toBe(200)
  },
  context: async ({ context, mockScenario, baseURL }, provideFixtures) => {
    if (!baseURL) throw new Error('Falta baseURL para el escenario mock.')
    await context.addCookies([{ name: 'duobalance-scenario', value: mockScenario, url: baseURL, httpOnly: true }])
    try {
      await provideFixtures(context)
    } finally {
      await context.close()
    }
  },
  partnerPage: async ({ browser, baseURL, mockScenario }, provideFixtures) => {
    if (!baseURL) throw new Error('Falta baseURL para el segundo usuario.')
    const context = await browser.newContext({ baseURL, serviceWorkers: 'block' })
    await context.addCookies([{ name: 'duobalance-scenario', value: mockScenario, url: baseURL, httpOnly: true }])
    const requests = await blockSupabaseRequests(context)
    try {
      await provideFixtures(await context.newPage())
      expect(requests).toEqual([])
    } finally {
      await context.close()
    }
  },
  supabaseRequests: async ({ context }, provideFixtures) => {
    const requests = await blockSupabaseRequests(context)
    await provideFixtures(requests)
    expect(requests).toEqual([])
  },
  demoPanel: async ({ page }, provideFixtures) => {
    await provideFixtures(new DemoPanel(page))
  },
  loginPage: async ({ page }, provideFixtures) => {
    await provideFixtures(new LoginPage(page))
  },
  onboardingPage: async ({ page }, provideFixtures) => {
    await provideFixtures(new OnboardingPage(page))
  },
  profilePage: async ({ page }, provideFixtures) => {
    await provideFixtures(new ProfilePage(page))
  },
  expensesPage: async ({ page }, provideFixtures) => {
    await provideFixtures(new ExpensesPage(page))
  },
  scenarios: async ({ demoPanel, loginPage, page }, provideFixtures) => {
    await provideFixtures(new DemoScenarios(demoPanel, loginPage, page))
  },
  resetMockData: [
    async ({ page, demoPanel, supabaseRequests: _supabaseRequests }, provideFixtures) => {
      await page.goto('/login')
      await demoPanel.resetMockData()
      await provideFixtures()
    },
    { auto: true },
  ],
})

export { expect } from '@playwright/test'
