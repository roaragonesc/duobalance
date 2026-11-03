import { expect, test } from '../fixtures'
import { journeyUsers } from '../data/journeyUsers'

test('TC08_crearUnEspacioCompartido', async ({
  anaAccount: _ana, loginPage, onboardingPage, page,
}) => {
  await test.step('TC42_entrarComoElPrimerUsuarioSinEspacio', async () => {
    await loginPage.signIn(journeyUsers.a.email, journeyUsers.a.password)
    await expect(page).toHaveURL(/\/onboarding$/)
  })
  await test.step('TC43_crearHogarE2EAl5050', async () => {
    await onboardingPage.createSpace('Hogar E2E', 'equal')
    await expect(page).toHaveURL(/\/onboarding\/invite$/)
    await page.goto('/space')
    await expect(page.getByRole('heading', { name: 'Hogar E2E', exact: true })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Resumen del espacio' })).toContainText('1 de 2')
  })
  await test.step('TC44_recargarYVolverAlOnboarding', async () => {
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Hogar E2E', exact: true })).toBeVisible()
    await page.goto('/onboarding')
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByLabel('Nombre del espacio')).toHaveCount(0)
  })
})
