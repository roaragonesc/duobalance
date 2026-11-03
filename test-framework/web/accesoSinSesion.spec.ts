import { expect, test } from '../fixtures'

test('TC07_impedirElAccesoSinSesion', async ({
  page, loginPage, profilePage,
}) => {
  await test.step('TC39_abrirURLPrivadaSinSesion', async () => {
    await page.goto('/expenses')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Gastos', exact: true })).toHaveCount(0)
  })
  await test.step('TC40_entrarConUnaCuentaConEspacioYAbrirLaMismaURL', async () => {
    await loginPage.signIn('rocio@duobalance.test', 'Demo1234!')
    await expect(page).toHaveURL(/\/expenses$/)
    await expect(page.getByRole('heading', { name: 'Gastos', exact: true })).toBeVisible()
  })
  await test.step('TC41_cerrarSesionYVolverAtras', async () => {
    await profilePage.signOut()
    await expect(page).toHaveURL(/\/login$/)
    await page.goBack()
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Gastos', exact: true })).toHaveCount(0)
    await page.goto('/expenses')
    await expect(page).toHaveURL(/\/login$/)
  })
})
