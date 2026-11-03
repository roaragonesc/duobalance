import { test, expect } from '../fixtures/apiWeb'
import { RegisterPage } from '../pages/RegisterPage'
import { LoginPage } from '../pages/LoginPage'
import { OnboardingPage } from '../pages/OnboardingPage'
import { ExpensesPage } from '../pages/ExpensesPage'
import { ProfilePage } from '../pages/ProfilePage'

test('TC23_completarRecorridoFinancieroConApi', async ({
  page, partnerPage, users, confirmationUrl,
}) => {
  await test.step('TC92_registrarConfirmarEIniciarAmbasSesionesMedianteUIReal', async () => {
    for (const [actor, user] of [[page, users.a], [partnerPage, users.b]] as const) {
      await actor.goto('/register')
      await new RegisterPage(actor).register(user)
      await expect(actor.getByRole('status')).toContainText('Te hemos enviado un correo')
      await actor.goto(await confirmationUrl(user.email))
      await actor.getByRole('button', { name: 'Confirmar mi correo' }).click()
      await expect(actor).toHaveURL(/\/login$/)
      await new LoginPage(actor).signIn(user.email, user.password)
      await expect(actor).toHaveURL(/\/onboarding$/)
    }
  })
  await test.step('TC93_crearEspacioEInvitarALaSegundaSesionIndependiente', async () => {
    await new OnboardingPage(page).createSpace('Hogar E2E', 'equal')
    await expect(page).toHaveURL(/\/onboarding\/invite$/)
    await new OnboardingPage(page).invite(users.b.email)
    await expect(page.getByLabel('Enlace de invitación')).toHaveValue(/\/join\?token=/)
    await partnerPage.goto(await page.getByLabel('Enlace de invitación').inputValue())
    await partnerPage.getByRole('button', { name: 'Aceptar invitación' }).click()
    await expect(partnerPage).toHaveURL(/\/dashboard$/)
  })
  const a = new ExpensesPage(page)
  const b = new ExpensesPage(partnerPage)
  let privateUrl = ''
  await test.step('TC94_crear80EurosCompartidosY35PrivadosDesdeLaPrimeraCuenta', async () => {
    await a.visit()
    await a.addExpense({ description: 'Supermercado E2E', amount: '80,00' })
    await a.addExpense({ description: 'Peluquería E2E', amount: '35,00', individual: true })
    await expect(a.row('Peluquería E2E')).toContainText('35,00')
    privateUrl = await a.row('Peluquería E2E').getByRole('link', { name: 'Editar Peluquería E2E' }).getAttribute('href') ?? ''
    expect(privateUrl).toMatch(/\/expenses\/[a-f0-9]{24}\/edit/)
  })
  await test.step('TC95_consultarSoloElGastoComunYDenegarAccesoAlPrivadoDesdeLaSegundaCuenta', async () => {
    await b.visit()
    await expect(b.row('Supermercado E2E')).toContainText('80,00')
    await expect(b.row('Peluquería E2E')).toHaveCount(0)
    await partnerPage.goto(privateUrl)
    await expect(partnerPage.getByRole('alert')).toHaveText('No se ha encontrado el gasto o no tienes permiso para modificarlo.')
    await b.visit()
    await b.addExpense({ description: 'Gasolina E2E', amount: '40,00' })
    await expect(b.row('Gasolina E2E')).toContainText('40,00')
  })
  await test.step('TC96_ambosVenDeudaRealDe20EurosYPersistencia', async () => {
    for (const actor of [page, partnerPage]) {
      await actor.goto('/expenses')
      await expect(new ExpensesPage(actor).row('Gasolina E2E')).toContainText('40,00')
      await actor.goto('/balance')
      await expect(actor.getByRole('region', { name: '¿Quién debe a quién?' })).toContainText('20,00')
      await actor.reload()
      await expect(actor.getByRole('region', { name: '¿Quién debe a quién?' })).toContainText('20,00')
    }
    await expect(page.getByRole('region', { name: '¿Quién debe a quién?' })).toContainText('Luis te debe')
    await expect(partnerPage.getByRole('region', { name: '¿Quién debe a quién?' })).toContainText('Tú debes a Ana')
  })
  await test.step('TC97_reiniciarLaSegundaSesionSinAfectarALaPrimeraNiPerderGastos', async () => {
    await new ProfilePage(partnerPage).signOut()
    await expect(partnerPage).toHaveURL(/\/login$/)
    await a.visit()
    await expect(a.row('Peluquería E2E')).toContainText('35,00')
    await new LoginPage(partnerPage).signIn(users.b.email, users.b.password)
    await expect(partnerPage).toHaveURL(/\/profile$/)
    await b.visit()
    await expect(b.row('Gasolina E2E')).toContainText('40,00')
    await expect(b.row('Supermercado E2E')).toContainText('80,00')
    await expect(b.row('Peluquería E2E')).toHaveCount(0)
  })
})
