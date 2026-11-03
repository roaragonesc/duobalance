import { expect, test } from '../fixtures'
import { journeyUsers } from '../data/journeyUsers'
import { ExpensesPage } from '../pages/ExpensesPage'
import { ProfilePage } from '../pages/ProfilePage'

test('TC18_recorridoFinancieroCompletoConDosUsuarios', async ({
  couple: _couple, page, partnerPage, expensesPage,
}) => {
  const b = new ExpensesPage(partnerPage)
  await test.step('TC80_confirmarEspacioCompartidoEIdentidadesDistintas', async () => {
    for (const actor of [page, partnerPage]) {
      await actor.goto('/space')
      await expect(actor.getByRole('heading', { name: 'Hogar E2E', exact: true })).toBeVisible()
      await expect(actor.getByRole('region', { name: 'Resumen del espacio' })).toContainText('2 de 2')
    }
    await expect(page.getByRole('region', { name: 'Miembros', exact: true })).toContainText(journeyUsers.a.email)
    await expect(partnerPage.getByRole('region', { name: 'Miembros', exact: true })).toContainText(journeyUsers.b.email)
  })
  await test.step('TC81_crearUnGastoComunYOtroPrivadoDesdeLaPrimeraCuenta', async () => {
    await expensesPage.visit()
    await expensesPage.addExpense({ description: 'Supermercado E2E', amount: '80,00' })
    await expensesPage.addExpense({ description: 'Peluquería E2E', amount: '35,00', individual: true })
    await expect(expensesPage.row('Supermercado E2E')).toContainText('80,00')
    await expect(expensesPage.row('Peluquería E2E')).toContainText('35,00')
  })
  await test.step('TC82_consultarSoloElGastoComunYCrearOtroDesdeLaSegundaCuenta', async () => {
    await b.visit()
    await expect(b.row('Supermercado E2E')).toContainText('80,00')
    await expect(b.row('Peluquería E2E')).toHaveCount(0)
    await partnerPage.getByLabel('Tipo', { exact: true }).selectOption('individual')
    await expect(b.row('Peluquería E2E')).toHaveCount(0)
    await partnerPage.getByLabel('Tipo', { exact: true }).selectOption('all')
    await b.addExpense({ description: 'Gasolina E2E', amount: '40,00' })
    await expect(b.row('Gasolina E2E')).toContainText('40,00')
  })
  await test.step('TC83_actualizarAmbasVistasSinDuplicadosNiFiltraciones', async () => {
    for (const actor of [page, partnerPage]) {
      await actor.goto('/expenses')
      await expect(new ExpensesPage(actor).row('Supermercado E2E')).toBeVisible()
      await actor.reload()
      const list = new ExpensesPage(actor)
      await expect(list.row('Supermercado E2E')).toHaveCount(1)
      await expect(list.row('Gasolina E2E')).toHaveCount(1)
      await expect(actor.getByRole('region', { name: 'Compartidos', exact: true })).toContainText('120,00')
    }
    await expect(expensesPage.row('Peluquería E2E')).toContainText('35,00')
    await expect(b.row('Peluquería E2E')).toHaveCount(0)
    await expect(partnerPage.getByRole('region', { name: 'Individuales', exact: true })).toContainText('0,00')
  })
  await test.step('TC84_verificar20EurosNetosYPersistencia', async () => {
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
  await test.step('TC85_cerrarLaSegundaSesionSinAfectarALaPrimera', async () => {
    await new ProfilePage(partnerPage).signOut()
    await expect(partnerPage).toHaveURL(/\/login$/)
    await partnerPage.goto('/expenses')
    await expect(partnerPage).toHaveURL(/\/login$/)
    await expensesPage.visit()
    await expect(expensesPage.row('Supermercado E2E')).toContainText('80,00')
    await expect(expensesPage.row('Gasolina E2E')).toContainText('40,00')
    await expect(expensesPage.row('Peluquería E2E')).toContainText('35,00')
  })
})
