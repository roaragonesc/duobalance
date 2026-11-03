import { expect, test } from '../fixtures'
import { journeyUsers } from '../data/journeyUsers'
import { RegisterPage } from '../pages/RegisterPage'
import { LoginPage } from '../pages/LoginPage'
import { OnboardingPage } from '../pages/OnboardingPage'
import { ProfilePage } from '../pages/ProfilePage'

test('TC15_recorridoCompletoDeRegistroCreacionDeEspacioEInvitacion', async ({
  page, partnerPage, demoPanel,
}) => {
  let invitation = ''
  await test.step('TC64_registrarYConfirmarAlPrimerUsuario', async () => {
    await page.goto('/register')
    const registration = new RegisterPage(page)
    await registration.register(journeyUsers.a)
    await expect(page.getByRole('status')).toContainText('Te hemos enviado un correo')
    await registration.confirm(journeyUsers.a.email)
    await expect(page).toHaveURL(/\/onboarding$/)
  })
  await test.step('TC65_iniciarSesionComoElPrimerUsuarioYCrearHogarE2E', async () => {
    await demoPanel.selectUser(null)
    await page.goto('/login')
    await new LoginPage(page).signIn(journeyUsers.a.email, journeyUsers.a.password)
    await expect(page).toHaveURL(/\/onboarding$/)
    await new OnboardingPage(page).createSpace('Hogar E2E', 'equal')
    await expect(page).toHaveURL(/\/onboarding\/invite$/)
  })
  await test.step('TC66_generarInvitacionAlSegundoUsuario', async () => {
    await new OnboardingPage(page).invite(journeyUsers.b.email)
    await expect(page.getByLabel('Enlace de invitación')).toHaveValue(/\/join\?token=/)
    invitation = await page.getByLabel('Enlace de invitación').inputValue()
  })
  await test.step('TC67_abrirInvitacionEnLaSegundaSesionYRegistrarAlSegundoUsuario', async () => {
    await partnerPage.goto(invitation)
    await expect(partnerPage.getByRole('link', { name: 'Crear una cuenta' })).toBeVisible()
    await expect(partnerPage.getByLabel('Usuario de prueba')).toHaveValue('')
    await partnerPage.getByRole('link', { name: 'Crear una cuenta' }).click()
    const registration = new RegisterPage(partnerPage)
    await registration.register(journeyUsers.b)
    await expect(partnerPage.getByRole('status')).toContainText('Te hemos enviado un correo')
    await registration.confirm(journeyUsers.b.email)
    await expect(partnerPage.getByRole('button', { name: 'Aceptar invitación' })).toBeVisible()
    await partnerPage.getByRole('button', { name: 'Aceptar invitación' }).click()
    await expect(partnerPage).toHaveURL(/\/dashboard$/)
  })
  await test.step('TC68_ambosConservanElMismoEspacioYNoPuedenCrearOtro', async () => {
    for (const actor of [page, partnerPage]) {
      await actor.goto('/space')
      await expect(actor.getByRole('heading', { name: 'Hogar E2E', exact: true })).toBeVisible()
      await actor.reload()
      await expect(actor.getByRole('heading', { name: 'Hogar E2E', exact: true })).toBeVisible()
      await expect(actor.getByRole('region', { name: 'Miembros', exact: true })).toContainText('Ana')
      await expect(actor.getByRole('region', { name: 'Miembros', exact: true })).toContainText('Luis')
      await expect(actor.getByRole('region', { name: 'Resumen del espacio' })).toContainText('2 de 2')
      await actor.goto('/onboarding')
      await expect(actor).toHaveURL(/\/dashboard$/)
    }
  })
  await test.step('TC69_rechazarTercerMiembro', async () => {
    await page.goto('/onboarding/invite')
    await new OnboardingPage(page).invite('tercero.e2e@example.test')
    await expect(page.getByRole('alert')).toHaveText('Este espacio ya tiene dos miembros.')
  })
  await test.step('TC70_cerrarAmbasSesionesYExigirAutenticacion', async () => {
    for (const actor of [page, partnerPage]) {
      await actor.goto('/dashboard')
      await new ProfilePage(actor).signOut()
      await expect(actor).toHaveURL(/\/login$/)
      await actor.goto('/expenses')
      await expect(actor).toHaveURL(/\/login$/)
    }
  })
})
