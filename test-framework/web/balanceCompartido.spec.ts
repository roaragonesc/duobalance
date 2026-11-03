import { expect, test } from '../fixtures'
import { ExpensesPage } from '../pages/ExpensesPage'

test('TC13_comprobarElBalanceDeDosGastosComunes', async ({
  couple: _couple, page, partnerPage, expensesPage,
}) => {
  await test.step('TC58_registrarPagoDe80EurosDesdeLaPrimeraCuenta', async () => {
    await expensesPage.addExpense({ description: 'Supermercado E2E', amount: '80,00' })
    await page.goto('/balance')
    await expect(page.getByRole('region', { name: '¿Quién debe a quién?' })).toContainText('Luis te debe')
    await expect(page.getByRole('region', { name: '¿Quién debe a quién?' })).toContainText('40,00')
  })
  await test.step('TC59_registrarPagoDe40EurosDesdeLaSegundaCuenta', async () => {
    const b = new ExpensesPage(partnerPage)
    await b.visit()
    await b.addExpense({ description: 'Gasolina E2E', amount: '40,00' })
    await expect(b.row('Gasolina E2E')).toContainText('40,00')
  })
  await test.step('TC60_verificarSaldoNetoYPersistenciaDesdeAmbasPerspectivas', async () => {
    for (const actor of [page, partnerPage]) {
      await actor.goto('/balance')
      await expect(actor.getByRole('region', { name: '¿Quién debe a quién?' })).toContainText('20,00')
      await expect(actor.getByRole('region', { name: /Resumen de/ })).toContainText('120,00')
      await actor.reload()
      await expect(actor.getByRole('region', { name: '¿Quién debe a quién?' })).toContainText('20,00')
    }
    await expect(page.getByRole('region', { name: '¿Quién debe a quién?' })).toContainText('Luis te debe')
    await expect(partnerPage.getByRole('region', { name: '¿Quién debe a quién?' })).toContainText('Tú debes a Ana')
  })
})
