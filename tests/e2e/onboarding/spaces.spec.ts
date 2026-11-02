import { expect, test } from '../../fixtures'
import { demoUsers } from '../../data/demoUsers'

test('crea un espacio proporcional e invita a una pareja', async ({
  scenarios,
  onboardingPage,
  demoPanel,
  page,
}) => {
  const spaceName = 'Piso de pruebas E2E'

  await scenarios.emptySpace()
  await expect(page).toHaveURL(/\/onboarding$/)
  await onboardingPage.createSpace(spaceName, 'proportional')
  await expect(page.getByRole('heading', { name: 'Invita a tu pareja' })).toBeVisible()

  await onboardingPage.invite(demoUsers.ines.email)
  await expect(page.getByLabel('Enlace de invitación')).toBeVisible()
  const invitationUrl = await page.getByLabel('Enlace de invitación').inputValue()

  await demoPanel.selectUser(null)
  await page.goto('/login')
  await page.getByLabel('Correo electrónico').fill(demoUsers.ines.email)
  await page.getByLabel('Contraseña', { exact: true }).fill(demoUsers.ines.password)
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await page.goto(invitationUrl)
  await expect(page.getByRole('button', { name: 'Aceptar invitación' })).toBeVisible()
  await page.getByRole('button', { name: 'Aceptar invitación' }).click()

  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('link', { name: new RegExp(spaceName) })).toBeVisible()
})

test('crea un espacio 50/50 e impide crear otro para la misma cuenta', async ({
  scenarios,
  onboardingPage,
  page,
}) => {
  const spaceName = 'Casa 50/50 E2E'

  await scenarios.emptySpace()
  await expect(page).toHaveURL(/\/onboarding$/)
  await onboardingPage.createSpace(spaceName, 'equal')
  await expect(page.getByRole('heading', { name: 'Invita a tu pareja' })).toBeVisible()
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('link', { name: new RegExp(spaceName) })).toBeVisible()

  await page.goto('/onboarding')
  await expect(page).toHaveURL(/\/dashboard$/)
})

test('rechaza una invitación a una cuenta que ya pertenece a otro espacio', async ({
  scenarios,
  onboardingPage,
  demoPanel,
  page,
}) => {
  await scenarios.emptySpace()
  await onboardingPage.createSpace('Espacio adicional E2E', 'equal')
  await onboardingPage.invite(demoUsers.solo.email)
  const invitationUrl = await page.getByLabel('Enlace de invitación').inputValue()

  await demoPanel.selectUser(null)
  await expect(page).toHaveURL(/\/$/)
  await page.goto('/login')
  await page.getByLabel('Correo electrónico').fill(demoUsers.solo.email)
  await page.getByLabel('Contraseña', { exact: true }).fill(demoUsers.solo.password)
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await expect(page.getByRole('heading', { name: /Hola, Sergio/ })).toBeVisible()
  await page.goto(invitationUrl)
  await expect(page.getByRole('button', { name: 'Aceptar invitación' })).toBeVisible()
  await page.getByRole('button', { name: 'Aceptar invitación' }).click()
  await expect(page.getByRole('alert')).toHaveText('Ya formas parte de un espacio compartido.')
})

test('no permite invitar a una tercera persona a un espacio completo', async ({
  scenarios,
  page,
  onboardingPage,
}) => {
  await scenarios.spaceWithPartner()
  await page.goto('/onboarding/invite')
  await onboardingPage.invite(demoUsers.mateo.email)
  await expect(page.getByRole('alert')).toHaveText('Este espacio ya tiene dos miembros.')
})
