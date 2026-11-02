import { expect, test as base } from '@playwright/test'
import { DemoPanel } from '../components/DemoPanel'
import { DemoScenarios } from '../helpers/demoScenarios'
import { blockSupabaseRequests } from '../helpers/networkGuard'
import { ExpensesPage } from '../pages/ExpensesPage'
import { LoginPage } from '../pages/LoginPage'
import { OnboardingPage } from '../pages/OnboardingPage'
import { ProfilePage } from '../pages/ProfilePage'

type E2EFixtures = {
  demoPanel: DemoPanel
  scenarios: DemoScenarios
  loginPage: LoginPage
  onboardingPage: OnboardingPage
  profilePage: ProfilePage
  expensesPage: ExpensesPage
  supabaseRequests: string[]
  resetMockData: void
}

export const test = base.extend<E2EFixtures>({
  supabaseRequests: async ({ page }, provideFixtures) => {
    const requests = await blockSupabaseRequests(page)
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
  scenarios: async ({ demoPanel, loginPage }, provideFixtures) => {
    await provideFixtures(new DemoScenarios(demoPanel, loginPage))
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
