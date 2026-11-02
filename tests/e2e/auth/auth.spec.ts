import { expect, test } from '../../fixtures'
import { demoUsers, registrationUser } from '../../data/demoUsers'

test('impide acceder al dashboard sin sesión', async ({ scenarios, page }) => {
  await scenarios.unauthenticated()
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login$/)
})

test('inicia sesión con credenciales correctas y conserva la sesión al recargar', async ({
  loginPage,
  page,
}) => {
  await loginPage.signIn(demoUsers.rocio.email, demoUsers.rocio.password)
  await expect(page.getByRole('heading', { name: /Hola, Rocío/ })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: /Hola, Rocío/ })).toBeVisible()
})

test('muestra un error con credenciales incorrectas', async ({ loginPage, page }) => {
  await loginPage.signIn(demoUsers.rocio.email, 'ClaveIncorrecta123!')
  await expect(page.getByRole('alert')).toHaveText(
    'El correo electrónico o la contraseña no son correctos.',
  )
})

test('valida los campos obligatorios del login', async ({ loginPage, page }) => {
  await loginPage.submit()

  await expect(page.getByLabel('Correo electrónico')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('alert').filter({ hasText: 'El correo electrónico es obligatorio.' })).toBeVisible()
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('alert').filter({ hasText: 'La contraseña es obligatoria.' })).toBeVisible()
})

test('registra una cuenta y simula la confirmación del correo', async ({ page }) => {
  await page.goto('/register')
  await page.getByLabel('Nombre').fill(registrationUser.name)
  await page.getByLabel('Correo electrónico').fill(registrationUser.email)
  await page.getByLabel('Contraseña', { exact: true }).fill(registrationUser.password)
  await page.getByLabel('Confirmar contraseña').fill(registrationUser.password)
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.getByText(/Te hemos enviado un correo para confirmar tu cuenta/)).toBeVisible()

  await page.getByRole('link', { name: `Confirmar correo de ${registrationUser.email}` }).click()
  await expect(page.getByRole('button', { name: 'Confirmar mi correo' })).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar mi correo' }).click()
  await expect(page).toHaveURL(/\/onboarding$/)
  await expect(page.getByRole('heading', { name: 'Crea tu espacio' })).toBeVisible()
})

test('permite cerrar sesión', async ({ loginPage, page, profilePage }) => {
  await loginPage.signIn(demoUsers.rocio.email, demoUsers.rocio.password)
  await expect(page.getByRole('heading', { name: /Hola, Rocío/ })).toBeVisible()

  await profilePage.signOut()
  await expect(page).toHaveURL(/\/login$/)
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login$/)
})

test('recupera la contraseña con el enlace mock y permite volver a iniciar sesión', async ({
  loginPage,
  page,
}) => {
  const newPassword = 'NuevaClave123!'

  await page.goto('/forgot-password')
  await page.getByLabel('Correo electrónico').fill(demoUsers.rocio.email)
  await page.getByRole('button', { name: 'Enviar enlace' }).click()
  await expect(page.getByRole('status')).toContainText('Si existe una cuenta con ese correo')

  await page.getByRole('button', { name: `Abrir recuperación de ${demoUsers.rocio.email}` }).click()
  await expect(page).toHaveURL(/\/reset-password\?mock_token=/)
  await page.getByLabel('Nueva contraseña', { exact: true }).fill(newPassword)
  await page.getByLabel('Confirmar nueva contraseña', { exact: true }).fill(newPassword)
  await page.getByRole('button', { name: 'Actualizar contraseña' }).click()
  await expect(page).toHaveURL(/\/login$/)

  await loginPage.signIn(demoUsers.rocio.email, newPassword)
  await expect(page.getByRole('heading', { name: /Hola, Rocío/ })).toBeVisible()
})
