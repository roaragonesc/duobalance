import { expect, test } from '../fixtures'
import { journeyUsers } from '../data/journeyUsers'
import { RegisterPage } from '../pages/RegisterPage'

const ana = journeyUsers.a

test('TC01_iniciarSesionConCredencialesValidas', async ({
  anaAccount: _ana, loginPage, onboardingPage, profilePage, page,
}) => {
  await test.step('Introducir credenciales válidas', async () => {
    await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible()
    await loginPage.signIn(ana.email, ana.password)
    await expect(page).toHaveURL(/\/onboarding$/)
    await expect(page.getByRole('heading', { name: 'Crea tu espacio' })).toBeVisible()
  })
  await test.step('Recargar y cerrar sesión', async () => {
    await page.reload()
    await expect(page).toHaveURL(/\/onboarding$/)
    await expect(page.getByLabel('Usuario de prueba')).not.toHaveValue('')
    await onboardingPage.createSpace('Hogar E2E', 'equal')
    await expect(page).toHaveURL(/\/onboarding\/invite$/)
    await page.goto('/dashboard')
    await profilePage.signOut()
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Crea tu espacio' })).toHaveCount(0)
  })
})

test('TC02_rechazarCredencialesIncorrectas', async ({
  anaAccount: _ana, loginPage, page,
}) => {
  await test.step('Enviar contraseña incorrecta', async () => {
    await loginPage.signIn(ana.email, 'Incorrecta123!')
    await expect(page.getByLabel('Correo electrónico')).toHaveValue(ana.email)
    await expect(page.getByRole('alert')).toHaveText('El correo electrónico o la contraseña no son correctos.')
  })
  await test.step('Intentar acceso privado', async () => {
    await page.goto('/expenses')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByLabel('Usuario de prueba')).toHaveValue('')
  })
})

test('TC03_validarCamposObligatoriosDelLogin', async ({
  anaAccount: _ana, loginPage, page,
}) => {
  await test.step('Enviar formulario vacío', async () => {
    await expect(page.getByLabel('Correo electrónico')).toHaveValue('')
    await loginPage.submit()
    await expect(page.getByLabel('Correo electrónico')).toHaveAccessibleDescription('El correo electrónico es obligatorio.')
    await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAccessibleDescription('La contraseña es obligatoria.')
  })
  await test.step('Completar solo correo', async () => {
    await page.getByLabel('Correo electrónico').fill(ana.email)
    await loginPage.submit()
    await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  })
  await test.step('Completar contraseña y continuar', async () => {
    await page.getByLabel('Contraseña', { exact: true }).fill(ana.password)
    await loginPage.submit()
    await expect(page).toHaveURL(/\/onboarding$/)
  })
})

test('TC04_registrarUnUsuarioNuevo', async ({
  page, demoPanel, loginPage,
}) => {
  const registration = new RegisterPage(page)
  await test.step('Registrar a Ana', async () => {
    await page.goto('/register')
    await registration.register(ana)
    await expect(page.getByRole('status')).toContainText('Te hemos enviado un correo')
    await expect(page.getByRole('link', { name: `Confirmar correo de ${ana.email}` })).toBeVisible()
  })
  await test.step('Confirmar el correo simulado', async () => {
    await registration.confirm(ana.email)
    await expect(page).toHaveURL(/\/onboarding$/)
  })
  await test.step('Cerrar la sesión simulada y entrar con la nueva cuenta', async () => {
    await demoPanel.selectUser(null)
    await loginPage.visit()
    await loginPage.signIn(ana.email, ana.password)
    await expect(page).toHaveURL(/\/onboarding$/)
    await expect(page.getByRole('heading', { name: 'Crea tu espacio' })).toBeVisible()
  })
})

test('TC05_rechazarContrasenasDistintas', async ({ page }) => {
  const registration = new RegisterPage(page)
  await test.step('Enviar contraseñas diferentes', async () => {
    await page.goto('/register')
    await registration.register(ana, 'OtraClave123!')
    await expect(page.getByLabel('Confirmar contraseña')).toHaveAccessibleDescription('Las contraseñas no coinciden.')
    await expect(page.getByRole('link', { name: `Confirmar correo de ${ana.email}` })).toHaveCount(0)
  })
  await test.step('Corregir y reenviar', async () => {
    await page.getByLabel('Confirmar contraseña').fill(ana.password)
    await page.getByRole('button', { name: 'Crear cuenta' }).click()
    await expect(page.getByRole('link', { name: `Confirmar correo de ${ana.email}` })).toBeVisible()
  })
})

test('TC06_recuperarContrasenaEnModoMock', async ({
  anaAccount: _ana, page, loginPage,
}) => {
  const password = 'NuevaClave123!'
  await test.step('Solicitar recuperación simulada', async () => {
    await page.getByRole('link', { name: 'Recuperar contraseña' }).click()
    await page.getByLabel('Correo electrónico').fill(ana.email)
    await page.getByRole('button', { name: 'Enviar enlace' }).click()
    await expect(page.getByRole('status')).toContainText('Si existe una cuenta con ese correo')
  })
  await test.step('Restablecer contraseña', async () => {
    await page.getByRole('button', { name: `Abrir recuperación de ${ana.email}` }).click()
    await page.getByLabel('Nueva contraseña', { exact: true }).fill(password)
    await page.getByLabel('Confirmar nueva contraseña', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Actualizar contraseña' }).click()
    await expect(page).toHaveURL(/\/login$/)
  })
  await test.step('Rechazar clave anterior y aceptar la nueva', async () => {
    await loginPage.signIn(ana.email, ana.password)
    await expect(page.getByRole('alert')).toHaveText('El correo electrónico o la contraseña no son correctos.')
    await loginPage.signIn(ana.email, password)
    await expect(page).toHaveURL(/\/onboarding$/)
  })
})

test('TC07_impedirElAccesoSinSesion', async ({
  page, loginPage, profilePage,
}) => {
  await test.step('Abrir URL privada sin sesión', async () => {
    await page.goto('/expenses')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Gastos', exact: true })).toHaveCount(0)
  })
  await test.step('Entrar con una cuenta con espacio y abrir la misma URL', async () => {
    await loginPage.signIn('rocio@duobalance.test', 'Demo1234!')
    await expect(page).toHaveURL(/\/expenses$/)
    await expect(page.getByRole('heading', { name: 'Gastos', exact: true })).toBeVisible()
  })
  await test.step('Cerrar sesión y volver atrás', async () => {
    await profilePage.signOut()
    await expect(page).toHaveURL(/\/login$/)
    await page.goBack()
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Gastos', exact: true })).toHaveCount(0)
    await page.goto('/expenses')
    await expect(page).toHaveURL(/\/login$/)
  })
})
