import { expect, test } from '../fixtures'
import { ExpensesPage } from '../pages/ExpensesPage'

test('TC17_unUsuarioCreaUnGastoIndividualQueElOtroNoPuedeVer', async ({
  couple: _couple, page, partnerPage, expensesPage,
}) => {
  let editUrl: string | null = null
  await test.step('TC75_crearUnGastoIndividualDesdeLaPrimeraCuenta', async () => {
    await expensesPage.addExpense({ description: 'Peluquería E2E', amount: '35,00', individual: true })
    await expect(expensesPage.row('Peluquería E2E')).toContainText('35,00')
    await expect(expensesPage.row('Peluquería E2E')).toContainText('Individual')
    editUrl = await expensesPage.row('Peluquería E2E').getByRole('link', { name: 'Editar Peluquería E2E' }).getAttribute('href')
  })
  await test.step('TC76_ocultarElGastoPrivadoEnGastosYResumenesDeLaSegundaCuenta', async () => {
    await partnerPage.goto('/expenses')
    await expect(partnerPage.getByRole('heading', { name: /Todavía no hay gastos en/ })).toBeVisible()
    await expect(partnerPage.getByRole('main')).not.toContainText('Peluquería E2E')
    await partnerPage.goto('/dashboard')
    await expect(partnerPage.getByRole('heading', { name: /Todavía no hay gastos en/ })).toBeVisible()
    await expect(partnerPage.getByRole('main')).not.toContainText('Peluquería E2E')
  })
  await test.step('TC77_elGastoNoGeneraBalanceParaNinguno', async () => {
    for (const actor of [page, partnerPage]) {
      await actor.goto('/balance')
      await expect(actor.getByRole('heading', { name: /Todavía no hay balance en/ })).toBeVisible()
      await expect(actor.getByRole('main')).not.toContainText('Peluquería E2E')
    }
  })
  await test.step('TC78_denegarAccesoDirectoAlGastoPrivadoDesdeLaSegundaCuenta', async () => {
    if (!editUrl) throw new Error('Falta el enlace real de edición.')
    await partnerPage.goto(editUrl)
    await expect(partnerPage.getByRole('alert')).toHaveText('No se ha encontrado el gasto o no tienes permiso para modificarlo.')
    await expect(partnerPage.getByLabel('Concepto')).toHaveCount(0)
  })
  await test.step('TC79_conservarElGastoPropioSinRevelarloMedianteFiltrosALaOtraCuenta', async () => {
    await page.goto('/expenses')
    await expect(expensesPage.row('Peluquería E2E')).toBeVisible()
    await page.reload()
    await expect(expensesPage.row('Peluquería E2E')).toHaveCount(1)
    await expect(expensesPage.row('Peluquería E2E')).toContainText('35,00')
    // A shared control expense makes the filter controls available in Luis's list.
    await expensesPage.addExpense({ description: 'Control compartido', amount: '2,00' })
    await partnerPage.goto('/expenses')
    await expect(new ExpensesPage(partnerPage).row('Control compartido')).toBeVisible()
    await partnerPage.getByLabel('Tipo', { exact: true }).selectOption('individual')
    await expect(new ExpensesPage(partnerPage).row('Peluquería E2E')).toHaveCount(0)
    await expect(partnerPage.getByRole('region', { name: 'Individuales', exact: true })).toContainText('0,00')
    await partnerPage.getByLabel('Tipo', { exact: true }).selectOption('shared')
    await partnerPage.getByLabel('Categoría', { exact: true }).selectOption('food')
    await expect(new ExpensesPage(partnerPage).row('Control compartido')).toBeVisible()
    await expect(new ExpensesPage(partnerPage).row('Peluquería E2E')).toHaveCount(0)
  })
})
