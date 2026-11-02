import { expect, test } from '../fixtures'
import { journeyUsers } from '../data/journeyUsers'
import { OnboardingPage } from '../pages/OnboardingPage'

test('TC08_crearUnEspacioCompartido', async ({
  anaAccount: _ana, loginPage, onboardingPage, page,
}) => {
  await test.step('Entrar como Ana sin espacio', async () => {
    await loginPage.signIn(journeyUsers.a.email, journeyUsers.a.password)
    await expect(page).toHaveURL(/\/onboarding$/)
  })
  await test.step('Crear Hogar E2E al 50/50', async () => {
    await onboardingPage.createSpace('Hogar E2E', 'equal')
    await expect(page).toHaveURL(/\/onboarding\/invite$/)
    await page.goto('/space')
    await expect(page.getByRole('heading', { name: 'Hogar E2E', exact: true })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Resumen del espacio' })).toContainText('1 de 2')
  })
  await test.step('Recargar y volver al onboarding', async () => {
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Hogar E2E', exact: true })).toBeVisible()
    await page.goto('/onboarding')
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByLabel('Nombre del espacio')).toHaveCount(0)
  })
})

test('TC09_invitarYVincularALaPareja', async ({
  couple: _couple, page, partnerPage,
}) => {
  await test.step('Consultar el mismo espacio en ambos contextos', async () => {
    for (const actor of [page, partnerPage]) {
      await actor.goto('/space')
      await expect(actor.getByRole('heading', { name: 'Hogar E2E', exact: true })).toBeVisible()
      await expect(actor.getByRole('region', { name: 'Miembros', exact: true })).toContainText('Ana')
      await expect(actor.getByRole('region', { name: 'Miembros', exact: true })).toContainText('Luis')
      await expect(actor.getByRole('region', { name: 'Resumen del espacio' })).toContainText('2 de 2')
    }
  })
  await test.step('Recargar ambas sesiones independientes', async () => {
    for (const actor of [page, partnerPage]) {
      await actor.reload()
      await expect(actor.getByRole('region', { name: 'Resumen del espacio' })).toContainText('2 de 2')
    }
    await expect(page.getByRole('region', { name: 'Miembros', exact: true }).getByText(journeyUsers.a.email)).toBeVisible()
    await expect(partnerPage.getByRole('region', { name: 'Miembros', exact: true }).getByText(journeyUsers.b.email)).toBeVisible()
  })
})

test('TC10_rechazarUnTercerMiembro', async ({
  couple: _couple, page, partnerPage,
}) => {
  await test.step('Intentar invitar a una tercera persona', async () => {
    await page.goto('/onboarding/invite')
    await new OnboardingPage(page).invite('tercero.e2e@example.test')
    await expect(page.getByRole('alert')).toHaveText('Este espacio ya tiene dos miembros.')
  })
  await test.step('Confirmar que solo permanecen Ana y Luis', async () => {
    for (const actor of [page, partnerPage]) {
      await actor.goto('/space')
      await expect(actor.getByRole('region', { name: 'Resumen del espacio' })).toContainText('2 de 2')
      await expect(actor.getByRole('region', { name: 'Miembros', exact: true }).getByRole('listitem')).toHaveCount(2)
      await expect(actor.getByRole('region', { name: 'Miembros', exact: true })).not.toContainText('tercero')
    }
  })
})
