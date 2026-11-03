import { expect, test } from '../fixtures'
import { ExpensesPage } from '../pages/ExpensesPage'

test('TC11_crearGastoComunYComprobarloDesdeAmbasCuentas', async ({
  couple: _couple, page, partnerPage, expensesPage,
}) => {
  const b = new ExpensesPage(partnerPage)
  await test.step('TC49_crearUnGastoCompartidoDe80EurosDesdeLaPrimeraCuenta', async () => {
    await expensesPage.addExpense({ description: 'Supermercado E2E', amount: '80,00' })
    await expect(expensesPage.row('Supermercado E2E')).toHaveCount(1)
    await expect(expensesPage.row('Supermercado E2E')).toContainText('80,00')
    await expect(expensesPage.row('Supermercado E2E')).toContainText('Compartido')
    await expect(expensesPage.row('Supermercado E2E').getByRole('cell', { name: 'Tú', exact: true })).toBeVisible()
  })
  await test.step('TC50_consultarLosMismosDatosSinDuplicadosDesdeLaSegundaCuenta', async () => {
    await b.visit()
    await expect(b.row('Supermercado E2E')).toHaveCount(1)
    await expect(b.row('Supermercado E2E')).toContainText('80,00')
    await expect(b.row('Supermercado E2E')).toContainText('Compartido')
    await expect(b.row('Supermercado E2E').getByRole('cell', { name: 'Ana', exact: true })).toBeVisible()
  })
  await test.step('TC51_consultarEspacioYRepartoDeAmbosMiembros', async () => {
    for (const actor of [page, partnerPage]) {
      await actor.goto('/space')
      await expect(actor.getByRole('heading', { name: 'Hogar E2E', exact: true })).toBeVisible()
      await expect(actor.getByRole('region', { name: 'Resumen del espacio' })).toContainText('50 % / 50 %')
      await actor.goto('/balance')
      await expect(actor.getByRole('region', { name: 'Tu aportación', exact: true })).toContainText('40,00')
      await expect(actor.getByRole('region', { name: 'Tu aportación', exact: true })).toContainText('50')
    }
  })
  await test.step('TC52_recargarYComprobarPersistencia', async () => {
    for (const actor of [page, partnerPage]) {
      await actor.goto('/expenses')
      await expect(new ExpensesPage(actor).row('Supermercado E2E')).toBeVisible()
      await actor.reload()
      await expect(new ExpensesPage(actor).row('Supermercado E2E')).toHaveCount(1)
      await expect(new ExpensesPage(actor).row('Supermercado E2E')).toContainText('80,00')
    }
  })
})
