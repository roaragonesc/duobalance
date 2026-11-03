import { expect, test } from '../fixtures'
import { journeyUsers } from '../data/journeyUsers'

test('TC09_invitarYVincularALaPareja', async ({
  couple: _couple, page, partnerPage,
}) => {
  await test.step('TC45_consultarElMismoEspacioEnAmbosContextos', async () => {
    for (const actor of [page, partnerPage]) {
      await actor.goto('/space')
      await expect(actor.getByRole('heading', { name: 'Hogar E2E', exact: true })).toBeVisible()
      await expect(actor.getByRole('region', { name: 'Miembros', exact: true })).toContainText('Ana')
      await expect(actor.getByRole('region', { name: 'Miembros', exact: true })).toContainText('Luis')
      await expect(actor.getByRole('region', { name: 'Resumen del espacio' })).toContainText('2 de 2')
    }
  })
  await test.step('TC46_recargarAmbasSesionesIndependientes', async () => {
    for (const actor of [page, partnerPage]) {
      await actor.reload()
      await expect(actor.getByRole('region', { name: 'Resumen del espacio' })).toContainText('2 de 2')
    }
    await expect(page.getByRole('region', { name: 'Miembros', exact: true }).getByText(journeyUsers.a.email)).toBeVisible()
    await expect(partnerPage.getByRole('region', { name: 'Miembros', exact: true }).getByText(journeyUsers.b.email)).toBeVisible()
  })
})
