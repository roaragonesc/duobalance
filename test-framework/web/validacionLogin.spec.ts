import { expect, test } from '../fixtures'
import { journeyUsers } from '../data/journeyUsers'

const ana = journeyUsers.a

test('TC03_validarCamposObligatoriosDelLogin', async ({
  anaAccount: _ana, loginPage, page,
}) => {
  await test.step('TC28_enviarFormularioVacio', async () => {
    await expect(page.getByLabel('Correo electrónico')).toHaveValue('')
    await loginPage.submit()
    await expect(page.getByLabel('Correo electrónico')).toHaveAccessibleDescription('El correo electrónico es obligatorio.')
    await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAccessibleDescription('La contraseña es obligatoria.')
  })
  await test.step('TC29_completarSoloCorreo', async () => {
    await page.getByLabel('Correo electrónico').fill(ana.email)
    await loginPage.submit()
    await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  })
  await test.step('TC30_completarContrasenaYContinuar', async () => {
    await page.getByLabel('Contraseña', { exact: true }).fill(ana.password)
    await loginPage.submit()
    await expect(page).toHaveURL(/\/onboarding$/)
  })
})
