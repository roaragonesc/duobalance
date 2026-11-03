import { expect, test } from '../fixtures/pagesDemo'

test('TC21_usarLaDemoEstaticaDesdeMovilSinBackend', async ({ page }) => {
  await page.goto('./')
  await expect(page).toHaveURL(/\/duobalance\/#\/login$/)
  await Promise.all([
    page.waitForEvent('domcontentloaded'),
    page.getByLabel('Usuario de prueba').selectOption('rocio'),
  ])
  await expect(page).toHaveURL(/\/duobalance\/#\/dashboard$/)
  await page.getByRole('button', { name: 'Ocultar panel mock' }).click()
  const skipLink = page.getByRole('link', { name: 'Saltar al contenido' })
  await skipLink.focus()
  await skipLink.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()
  await expect(page).toHaveURL(/\/duobalance\/#\/dashboard$/)
  await page.getByRole('link', { name: 'Gastos', exact: true }).click()
  await page.getByRole('link', { name: 'Añadir gasto' }).click()
  await page.getByLabel('Concepto').fill('Compra demo Pages')
  await page.getByLabel('Importe (€)').fill('12,50')
  await page.getByLabel('Categoría').selectOption('food')
  await page.getByRole('button', { name: 'Añadir gasto' }).click()
  const row = page.getByRole('row').filter({
    has: page.getByRole('rowheader', { name: 'Compra demo Pages', exact: true }),
  })
  await expect(row).toContainText('12,50')
  await page.reload()
  await expect(page).toHaveURL(/\/duobalance\/#\/expenses$/)
  await expect(row).toContainText('12,50')
  await Promise.all([
    page.waitForEvent('domcontentloaded'),
    page.getByRole('button', { name: 'Restablecer datos de prueba' }).click(),
  ])
  await expect(page).toHaveURL(/\/duobalance\/#\/login$/)
  await expect(page.getByLabel('Usuario de prueba')).toHaveValue('')
})
