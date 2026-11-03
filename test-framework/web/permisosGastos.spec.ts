import { expect, test } from '../fixtures'
import { ExpensesPage } from '../pages/ExpensesPage'

test('TC19_respetarPermisosDeEdicionYAccesoAGastos', async ({
  couple: _couple, page, partnerPage, expensesPage,
}) => {
  const b = new ExpensesPage(partnerPage)
  let sharedUrl: string | null = null
  let privateUrl: string | null = null
  await test.step('TC86_crearUnGastoPrivadoYOtroCompartidoDesdeLaPrimeraCuenta', async () => {
    await expensesPage.addExpense({ description: 'Peluquería E2E', amount: '35,00', individual: true })
    privateUrl = await expensesPage.row('Peluquería E2E').getByRole('link', { name: 'Editar Peluquería E2E' }).getAttribute('href')
    await expensesPage.addExpense({ description: 'Supermercado E2E', amount: '80,00' })
    sharedUrl = await expensesPage.row('Supermercado E2E').getByRole('link', { name: 'Editar Supermercado E2E' }).getAttribute('href')
    await expect(expensesPage.row('Supermercado E2E').getByRole('button', { name: 'Eliminar Supermercado E2E' })).toBeVisible()
  })
  await test.step('TC87_mostrarSoloElGastoCompartidoSinAccionesAjenasEnLaSegundaCuenta', async () => {
    await b.visit()
    await expect(b.row('Peluquería E2E')).toHaveCount(0)
    await expect(b.row('Supermercado E2E')).toContainText('80,00')
    await expect(b.row('Supermercado E2E').getByRole('link', { name: 'Editar Supermercado E2E' })).toHaveCount(0)
    await expect(b.row('Supermercado E2E').getByRole('button', { name: 'Eliminar Supermercado E2E' })).toHaveCount(0)
  })
  await test.step('TC88_denegarEdicionDirectaDeAmbosGastos', async () => {
    for (const url of [privateUrl, sharedUrl]) {
      if (!url) throw new Error('Falta el enlace real del gasto.')
      await partnerPage.goto(url)
      await expect(partnerPage.getByRole('alert')).toHaveText('No se ha encontrado el gasto o no tienes permiso para modificarlo.')
      await expect(partnerPage.getByRole('button', { name: 'Guardar cambios' })).toHaveCount(0)
    }
  })
  await test.step('TC89_recargarYComprobarQueNoHuboCambiosNoAutorizados', async () => {
    for (const actor of [page, partnerPage]) {
      await actor.goto('/expenses')
      await expect(new ExpensesPage(actor).row('Supermercado E2E')).toBeVisible()
      await actor.reload()
      await expect(new ExpensesPage(actor).row('Supermercado E2E')).toContainText('80,00')
      await expect(new ExpensesPage(actor).row('Supermercado E2E')).toHaveCount(1)
    }
    await expect(expensesPage.row('Peluquería E2E')).toContainText('35,00')
    await expect(b.row('Peluquería E2E')).toHaveCount(0)
  })
})
