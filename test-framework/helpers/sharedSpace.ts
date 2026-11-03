import type { Page } from '@playwright/test'
import { journeyUsers } from '../data/journeyUsers'
import { OnboardingPage } from '../pages/OnboardingPage'
import { RegisterPage } from '../pages/RegisterPage'

export const journeySpace = 'Hogar E2E'

export async function registerUser(page: Page, user: typeof journeyUsers.a) {
  await page.goto('/register')
  const registration = new RegisterPage(page)
  await registration.register(user)
  await registration.confirm(user.email)
}

export async function prepareSharedSpace(a: Page, b: Page) {
  await registerUser(a, journeyUsers.a)
  const onboarding = new OnboardingPage(a)
  await onboarding.createSpace(journeySpace, 'equal')
  await onboarding.invite(journeyUsers.b.email)
  const invitation = await a.getByLabel('Enlace de invitación').inputValue()
  await registerUser(b, journeyUsers.b)
  await b.goto(invitation)
  await b.getByRole('button', { name: 'Aceptar invitación' }).click()
  await b.waitForURL((url) => url.pathname === '/dashboard')
  await a.goto('/expenses')
  await a.getByRole('heading', { name: 'Gastos', exact: true }).waitFor()
}
