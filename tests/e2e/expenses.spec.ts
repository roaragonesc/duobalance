import { expect, test } from '../fixtures'
import { ExpensesPage } from '../pages/ExpensesPage'

for (const title of [
  'TC11_crearGastoComunYComprobarloDesdeAmbasCuentas',
  'TC16_unUsuarioCreaUnGastoComunYElOtroLoConsulta',
]) {
  test(title, async ({
    couple: _couple, page, partnerPage, expensesPage,
  }) => {
    const b = new ExpensesPage(partnerPage)
    await test.step('Ana crea supermercado compartido de 80 euros', async () => {
      await expensesPage.addExpense({ description: 'Supermercado E2E', amount: '80,00' })
      await expect(expensesPage.row('Supermercado E2E')).toHaveCount(1)
      await expect(expensesPage.row('Supermercado E2E')).toContainText('80,00')
      await expect(expensesPage.row('Supermercado E2E')).toContainText('Compartido')
      await expect(expensesPage.row('Supermercado E2E').getByRole('cell', { name: 'Tú', exact: true })).toBeVisible()
    })
    await test.step('Luis consulta los mismos datos, sin duplicados', async () => {
      await b.visit()
      await expect(b.row('Supermercado E2E')).toHaveCount(1)
      await expect(b.row('Supermercado E2E')).toContainText('80,00')
      await expect(b.row('Supermercado E2E')).toContainText('Compartido')
      await expect(b.row('Supermercado E2E').getByRole('cell', { name: 'Ana', exact: true })).toBeVisible()
    })
    await test.step('Consultar espacio y reparto de ambos miembros', async () => {
      for (const actor of [page, partnerPage]) {
        await actor.goto('/space')
        await expect(actor.getByRole('heading', { name: 'Hogar E2E', exact: true })).toBeVisible()
        await expect(actor.getByRole('region', { name: 'Resumen del espacio' })).toContainText('50 % / 50 %')
        await actor.goto('/balance')
        await expect(actor.getByRole('region', { name: 'Tu aportación', exact: true })).toContainText('40,00')
        await expect(actor.getByRole('region', { name: 'Tu aportación', exact: true })).toContainText('50')
      }
    })
    await test.step('Recargar y comprobar persistencia', async () => {
      for (const actor of [page, partnerPage]) {
        await actor.goto('/expenses')
        await expect(new ExpensesPage(actor).row('Supermercado E2E')).toBeVisible()
        await actor.reload()
        await expect(new ExpensesPage(actor).row('Supermercado E2E')).toHaveCount(1)
        await expect(new ExpensesPage(actor).row('Supermercado E2E')).toContainText('80,00')
      }
    })
  })
}

test('TC13_comprobarElBalanceDeDosGastosComunes', async ({
  couple: _couple, page, partnerPage, expensesPage,
}) => {
  await test.step('Ana paga 80 euros', async () => {
    await expensesPage.addExpense({ description: 'Supermercado E2E', amount: '80,00' })
    await page.goto('/balance')
    await expect(page.getByRole('region', { name: '¿Quién debe a quién?' })).toContainText('Luis te debe')
    await expect(page.getByRole('region', { name: '¿Quién debe a quién?' })).toContainText('40,00')
  })
  await test.step('Luis paga 40 euros', async () => {
    const b = new ExpensesPage(partnerPage)
    await b.visit()
    await b.addExpense({ description: 'Gasolina E2E', amount: '40,00' })
    await expect(b.row('Gasolina E2E')).toContainText('40,00')
  })
  await test.step('Verificar saldo neto y persistencia desde ambas perspectivas', async () => {
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

test('TC14_modificarUnGastoComun', async ({
  couple: _couple, page, partnerPage, expensesPage,
}) => {
  const b = new ExpensesPage(partnerPage)
  await test.step('Crear gasto compartido y verlo desde Luis', async () => {
    await expensesPage.addExpense({ description: 'Supermercado E2E', amount: '80,00' })
    await b.visit()
    await expect(b.row('Supermercado E2E')).toContainText('80,00')
  })
  await test.step('Ana abre la edición por teclado y modifica su gasto', async () => {
    await expensesPage.editAmount('Supermercado E2E', '100,00')
    await expect(expensesPage.row('Supermercado E2E')).toContainText('100,00')
    await partnerPage.reload()
    await expect(b.row('Supermercado E2E')).toContainText('100,00')
    await expect(b.row('Supermercado E2E')).toHaveCount(1)
  })
  await test.step('Persistir importe y saldo actualizado', async () => {
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
