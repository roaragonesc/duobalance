import { expect, test } from '../fixtures'
import { journeyUsers } from '../data/journeyUsers'

const ana = journeyUsers.a

test('TC06_recuperarContrasenaEnModoMock', async ({
  anaAccount: _ana, page, loginPage,
}) => {
  const password = 'NuevaClave123!'
  await test.step('TC36_solicitarRecuperacionSimulada', async () => {
    await page.getByRole('link', { name: 'Recuperar contraseña' }).click()
    await page.getByLabel('Correo electrónico').fill(ana.email)
    await page.getByRole('button', { name: 'Enviar enlace' }).click()
    await expect(page.getByRole('status')).toContainText('Si existe una cuenta con ese correo')
  })
  await test.step('TC37_restablecerContrasena', async () => {
    await page.getByRole('button', { name: `Abrir recuperación de ${ana.email}` }).click()
    await page.getByLabel('Nueva contraseña', { exact: true }).fill(password)
    await page.getByLabel('Confirmar nueva contraseña', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Actualizar contraseña' }).click()
    await expect(page).toHaveURL(/\/login$/)
  })
  await test.step('TC38_rechazarClaveAnteriorYAceptarLaNueva', async () => {
    await loginPage.signIn(ana.email, ana.password)
    await expect(page.getByRole('alert')).toHaveText('El correo electrónico o la contraseña no son correctos.')
    await loginPage.signIn(ana.email, password)
    await expect(page).toHaveURL(/\/onboarding$/)
  })
})
