import { expect, test } from '../fixtures'
import { ExpensesPage } from '../pages/ExpensesPage'

test('TC14_modificarUnGastoComun', async ({
  couple: _couple, page, partnerPage, expensesPage,
}) => {
  const b = new ExpensesPage(partnerPage)
  await test.step('TC61_crearGastoCompartidoYVerloDesdeElSegundoUsuario', async () => {
    await expensesPage.addExpense({ description: 'Supermercado E2E', amount: '80,00' })
    await b.visit()
    await expect(b.row('Supermercado E2E')).toContainText('80,00')
  })
  await test.step('TC62_abrirLaEdicionPorTecladoYModificarElGastoPropio', async () => {
    await expensesPage.editAmount('Supermercado E2E', '100,00')
    await expect(expensesPage.row('Supermercado E2E')).toContainText('100,00')
    await partnerPage.reload()
    await expect(b.row('Supermercado E2E')).toContainText('100,00')
    await expect(b.row('Supermercado E2E')).toHaveCount(1)
  })
  await test.step('TC63_persistirImporteYSaldoActualizado', async () => {
    for (const actor of [page, partnerPage]) {
      await actor.goto('/balance')
      await expect(actor.getByRole('region', { name: '¿Quién debe a quién?' })).toContainText('50,00')
      await actor.reload()
      await expect(actor.getByRole('region', { name: '¿Quién debe a quién?' })).toContainText('50,00')
      await actor.goto('/expenses')
      await expect(new ExpensesPage(actor).row('Supermercado E2E')).toContainText('100,00')
    }
  })
})
