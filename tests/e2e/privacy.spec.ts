import { expect, test } from '../fixtures'
import { ExpensesPage } from '../pages/ExpensesPage'

for (const title of [
  'TC12_crearGastoIndividualYComprobarSuPrivacidad',
  'TC17_unUsuarioCreaUnGastoIndividualQueElOtroNoPuedeVer',
]) {
  test(title, async ({
    couple: _couple, page, partnerPage, expensesPage,
  }) => {
    let editUrl: string | null = null
    await test.step('Ana crea su gasto individual', async () => {
      await expensesPage.addExpense({ description: 'Peluquería E2E', amount: '35,00', individual: true })
      await expect(expensesPage.row('Peluquería E2E')).toContainText('35,00')
      await expect(expensesPage.row('Peluquería E2E')).toContainText('Individual')
      editUrl = await expensesPage.row('Peluquería E2E').getByRole('link', { name: 'Editar Peluquería E2E' }).getAttribute('href')
    })
    await test.step('Luis no lo ve en sus gastos ni resúmenes', async () => {
      await partnerPage.goto('/expenses')
      await expect(partnerPage.getByRole('heading', { name: /Todavía no hay gastos en/ })).toBeVisible()
      await expect(partnerPage.getByRole('main')).not.toContainText('Peluquería E2E')
      await partnerPage.goto('/dashboard')
      await expect(partnerPage.getByRole('heading', { name: /Todavía no hay gastos en/ })).toBeVisible()
      await expect(partnerPage.getByRole('main')).not.toContainText('Peluquería E2E')
    })
    await test.step('El gasto no genera balance para ninguno', async () => {
      for (const actor of [page, partnerPage]) {
        await actor.goto('/balance')
        await expect(actor.getByRole('heading', { name: /Todavía no hay balance en/ })).toBeVisible()
        await expect(actor.getByRole('main')).not.toContainText('Peluquería E2E')
      }
    })
    await test.step('El acceso directo de Luis no revela el gasto', async () => {
      if (!editUrl) throw new Error('Falta el enlace real de edición.')
      await partnerPage.goto(editUrl)
      await expect(partnerPage.getByRole('alert')).toHaveText('No se ha encontrado el gasto o no tienes permiso para modificarlo.')
      await expect(partnerPage.getByLabel('Concepto')).toHaveCount(0)
    })
    await test.step('Ana conserva el gasto y Luis no puede revelarlo con filtros', async () => {
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
}

test('TC19_respetarPermisosDeEdicionYAccesoAGastos', async ({
  couple: _couple, page, partnerPage, expensesPage,
}) => {
  const b = new ExpensesPage(partnerPage)
  let sharedUrl: string | null = null
  let privateUrl: string | null = null
  await test.step('Ana crea gasto privado y compartido', async () => {
    await expensesPage.addExpense({ description: 'Peluquería E2E', amount: '35,00', individual: true })
    privateUrl = await expensesPage.row('Peluquería E2E').getByRole('link', { name: 'Editar Peluquería E2E' }).getAttribute('href')
    await expensesPage.addExpense({ description: 'Supermercado E2E', amount: '80,00' })
    sharedUrl = await expensesPage.row('Supermercado E2E').getByRole('link', { name: 'Editar Supermercado E2E' }).getAttribute('href')
    await expect(expensesPage.row('Supermercado E2E').getByRole('button', { name: 'Eliminar Supermercado E2E' })).toBeVisible()
  })
  await test.step('Luis solo ve el compartido y no dispone de acciones ajenas', async () => {
    await b.visit()
    await expect(b.row('Peluquería E2E')).toHaveCount(0)
    await expect(b.row('Supermercado E2E')).toContainText('80,00')
    await expect(b.row('Supermercado E2E').getByRole('link', { name: 'Editar Supermercado E2E' })).toHaveCount(0)
    await expect(b.row('Supermercado E2E').getByRole('button', { name: 'Eliminar Supermercado E2E' })).toHaveCount(0)
  })
  await test.step('Denegar edición directa de ambos gastos', async () => {
    for (const url of [privateUrl, sharedUrl]) {
      if (!url) throw new Error('Falta el enlace real del gasto.')
      await partnerPage.goto(url)
      await expect(partnerPage.getByRole('alert')).toHaveText('No se ha encontrado el gasto o no tienes permiso para modificarlo.')
      await expect(partnerPage.getByRole('button', { name: 'Guardar cambios' })).toHaveCount(0)
    }
  })
  await test.step('Recargar y comprobar que no hubo cambios no autorizados', async () => {
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
