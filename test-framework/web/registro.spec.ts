import { expect, test } from '../fixtures'
import { journeyUsers } from '../data/journeyUsers'
import { RegisterPage } from '../pages/RegisterPage'

const ana = journeyUsers.a

test('TC04_registrarUnUsuarioNuevo', async ({
  page, demoPanel, loginPage,
}) => {
  const registration = new RegisterPage(page)
  await test.step('TC31_registrarAlPrimerUsuario', async () => {
    await page.goto('/register')
    await registration.register(ana)
    await expect(page.getByRole('status')).toContainText('Te hemos enviado un correo')
    await expect(page.getByRole('link', { name: `Confirmar correo de ${ana.email}` })).toBeVisible()
  })
  await test.step('TC32_confirmarElCorreoSimulado', async () => {
    await registration.confirm(ana.email)
    await expect(page).toHaveURL(/\/onboarding$/)
  })
  await test.step('TC33_cerrarLaSesionSimuladaYEntrarConLaNuevaCuenta', async () => {
    await demoPanel.selectUser(null)
    await loginPage.visit()
    await loginPage.signIn(ana.email, ana.password)
    await expect(page).toHaveURL(/\/onboarding$/)
    await expect(page.getByRole('heading', { name: 'Crea tu espacio' })).toBeVisible()
  })
})
