import { expect, test } from '../../fixtures'
import { demoUsers } from '../../data/demoUsers'

test('Rocío y Pablo ven gastos compartidos, pero no los individuales', async ({
  scenarios,
  expensesPage,
  demoPanel,
  page,
}) => {
  await scenarios.spaceWithPartner()
  await page.getByRole('link', { name: 'Gastos' }).click()
  await expensesPage.addExpense({
    description: 'Compra compartida E2E',
    amount: '12,34',
  })
  await expect(page.getByText('Compra compartida E2E', { exact: true })).toBeVisible()

  await expensesPage.addExpense({
    description: 'Compra privada de Rocío',
    amount: '9,99',
    individual: true,
  })
  await expect(page.getByText('Compra privada de Rocío', { exact: true })).toBeVisible()

  await demoPanel.selectUser('pablo')
  await expect(page.getByRole('heading', { name: new RegExp(`Hola, ${demoUsers.pablo.name}`) })).toBeVisible()
  await page.getByRole('link', { name: 'Gastos' }).click()
  await expect(page.getByText('Compra compartida E2E', { exact: true })).toBeVisible()
  await expect(page.getByText('Compra privada de Rocío', { exact: true })).toHaveCount(0)
})
