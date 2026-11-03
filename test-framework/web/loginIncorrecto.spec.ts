import { expect, test } from '../fixtures'
import { journeyUsers } from '../data/journeyUsers'

const ana = journeyUsers.a

test('TC02_rechazarCredencialesIncorrectas', async ({
  anaAccount: _ana, loginPage, page,
}) => {
  await test.step('TC26_enviarContrasenaIncorrecta', async () => {
    await loginPage.signIn(ana.email, 'Incorrecta123!')
    await expect(page.getByLabel('Correo electrónico')).toHaveValue(ana.email)
    await expect(page.getByRole('alert')).toHaveText('El correo electrónico o la contraseña no son correctos.')
  })
  await test.step('TC27_intentarAccesoPrivado', async () => {
    await page.goto('/expenses')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByLabel('Usuario de prueba')).toHaveValue('')
  })
})
