import { expect, test } from '../fixtures'
import { journeyUsers } from '../data/journeyUsers'

const ana = journeyUsers.a

test('TC01_iniciarSesionConCredencialesValidas', async ({
  anaAccount: _ana, loginPage, onboardingPage, profilePage, page,
}) => {
  await test.step('TC24_introducirCredencialesValidas', async () => {
    await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible()
    await loginPage.signIn(ana.email, ana.password)
    await expect(page).toHaveURL(/\/onboarding$/)
    await expect(page.getByRole('heading', { name: 'Crea tu espacio' })).toBeVisible()
  })
  await test.step('TC25_recargarYCerrarSesion', async () => {
    await page.reload()
    await expect(page).toHaveURL(/\/onboarding$/)
    await expect(page.getByLabel('Usuario de prueba')).not.toHaveValue('')
    await onboardingPage.createSpace('Hogar E2E', 'equal')
    await expect(page).toHaveURL(/\/onboarding\/invite$/)
    await page.goto('/dashboard')
    await profilePage.signOut()
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Crea tu espacio' })).toHaveCount(0)
  })
})
