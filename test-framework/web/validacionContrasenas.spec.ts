import { expect, test } from '../fixtures'
import { journeyUsers } from '../data/journeyUsers'
import { RegisterPage } from '../pages/RegisterPage'

const ana = journeyUsers.a

test('TC05_rechazarContrasenasDistintas', async ({ page }) => {
  const registration = new RegisterPage(page)
  await test.step('TC34_enviarContrasenasDiferentes', async () => {
    await page.goto('/register')
    await registration.register(ana, 'OtraClave123!')
    await expect(page.getByLabel('Confirmar contraseña')).toHaveAccessibleDescription('Las contraseñas no coinciden.')
    await expect(page.getByRole('link', { name: `Confirmar correo de ${ana.email}` })).toHaveCount(0)
  })
  await test.step('TC35_corregirYReenviar', async () => {
    await page.getByLabel('Confirmar contraseña').fill(ana.password)
    await page.getByRole('button', { name: 'Crear cuenta' }).click()
    await expect(page.getByRole('link', { name: `Confirmar correo de ${ana.email}` })).toBeVisible()
  })
})
