import { expect, test } from '../fixtures'
import { journeyUsers } from '../data/journeyUsers'
import { RegisterPage } from '../pages/RegisterPage'
import { LoginPage } from '../pages/LoginPage'
import { OnboardingPage } from '../pages/OnboardingPage'
import { ExpensesPage } from '../pages/ExpensesPage'
import { ProfilePage } from '../pages/ProfilePage'

test('TC15_recorridoCompletoDeRegistroCreacionDeEspacioEInvitacion', async ({
  page, partnerPage, demoPanel,
}) => {
  let invitation = ''
  await test.step('Registrar y confirmar a Ana', async () => {
    await page.goto('/register')
    const registration = new RegisterPage(page)
    await registration.register(journeyUsers.a)
    await expect(page.getByRole('status')).toContainText('Te hemos enviado un correo')
    await registration.confirm(journeyUsers.a.email)
    await expect(page).toHaveURL(/\/onboarding$/)
  })
  await test.step('Iniciar sesión como Ana y crear Hogar E2E', async () => {
    await demoPanel.selectUser(null)
    await page.goto('/login')
    await new LoginPage(page).signIn(journeyUsers.a.email, journeyUsers.a.password)
    await expect(page).toHaveURL(/\/onboarding$/)
    await new OnboardingPage(page).createSpace('Hogar E2E', 'equal')
    await expect(page).toHaveURL(/\/onboarding\/invite$/)
  })
  await test.step('Generar invitación a Luis', async () => {
    await new OnboardingPage(page).invite(journeyUsers.b.email)
    await expect(page.getByLabel('Enlace de invitación')).toHaveValue(/\/join\?token=/)
    invitation = await page.getByLabel('Enlace de invitación').inputValue()
  })
  await test.step('Abrir invitación en B y registrar a Luis', async () => {
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
  await test.step('Ambos conservan el mismo espacio y no pueden crear otro', async () => {
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
  await test.step('Rechazar tercer miembro', async () => {
    await page.goto('/onboarding/invite')
    await new OnboardingPage(page).invite('tercero.e2e@example.test')
    await expect(page.getByRole('alert')).toHaveText('Este espacio ya tiene dos miembros.')
  })
  await test.step('Cerrar ambas sesiones y exigir autenticación', async () => {
    for (const actor of [page, partnerPage]) {
      await actor.goto('/dashboard')
      await new ProfilePage(actor).signOut()
      await expect(actor).toHaveURL(/\/login$/)
      await actor.goto('/expenses')
      await expect(actor).toHaveURL(/\/login$/)
    }
  })
})

test('TC18_recorridoFinancieroCompletoConDosUsuarios', async ({
  couple: _couple, page, partnerPage, expensesPage,
}) => {
  const b = new ExpensesPage(partnerPage)
  await test.step('Confirmar espacio compartido e identidades distintas', async () => {
    for (const actor of [page, partnerPage]) {
      await actor.goto('/space')
      await expect(actor.getByRole('heading', { name: 'Hogar E2E', exact: true })).toBeVisible()
      await expect(actor.getByRole('region', { name: 'Resumen del espacio' })).toContainText('2 de 2')
    }
    await expect(page.getByRole('region', { name: 'Miembros', exact: true })).toContainText(journeyUsers.a.email)
    await expect(partnerPage.getByRole('region', { name: 'Miembros', exact: true })).toContainText(journeyUsers.b.email)
  })
  await test.step('Ana crea supermercado común y peluquería privada', async () => {
    await expensesPage.visit()
    await expensesPage.addExpense({ description: 'Supermercado E2E', amount: '80,00' })
    await expensesPage.addExpense({ description: 'Peluquería E2E', amount: '35,00', individual: true })
    await expect(expensesPage.row('Supermercado E2E')).toContainText('80,00')
    await expect(expensesPage.row('Peluquería E2E')).toContainText('35,00')
  })
  await test.step('Luis consulta únicamente el común y crea gasolina', async () => {
    await b.visit()
    await expect(b.row('Supermercado E2E')).toContainText('80,00')
    await expect(b.row('Peluquería E2E')).toHaveCount(0)
    await partnerPage.getByLabel('Tipo', { exact: true }).selectOption('individual')
    await expect(b.row('Peluquería E2E')).toHaveCount(0)
    await partnerPage.getByLabel('Tipo', { exact: true }).selectOption('all')
    await b.addExpense({ description: 'Gasolina E2E', amount: '40,00' })
    await expect(b.row('Gasolina E2E')).toContainText('40,00')
  })
  await test.step('Actualizar ambas vistas sin duplicados ni filtraciones', async () => {
    for (const actor of [page, partnerPage]) {
      await actor.goto('/expenses')
      await expect(new ExpensesPage(actor).row('Supermercado E2E')).toBeVisible()
      await actor.reload()
      const list = new ExpensesPage(actor)
      await expect(list.row('Supermercado E2E')).toHaveCount(1)
      await expect(list.row('Gasolina E2E')).toHaveCount(1)
      await expect(actor.getByRole('region', { name: 'Compartidos', exact: true })).toContainText('120,00')
    }
    await expect(expensesPage.row('Peluquería E2E')).toContainText('35,00')
    await expect(b.row('Peluquería E2E')).toHaveCount(0)
    await expect(partnerPage.getByRole('region', { name: 'Individuales', exact: true })).toContainText('0,00')
  })
  await test.step('Verificar 20 euros netos y persistencia', async () => {
    for (const actor of [page, partnerPage]) {
      await actor.goto('/balance')
      await expect(actor.getByRole('region', { name: '¿Quién debe a quién?' })).toContainText('20,00')
      await expect(actor.getByRole('region', { name: /Resumen de/ })).toContainText('120,00')
      await actor.reload()
      await expect(actor.getByRole('region', { name: '¿Quién debe a quién?' })).toContainText('20,00')
    }
    await expect(page.getByRole('region', { name: '¿Quién debe a quién?' })).toContainText('Luis te debe')
    await expect(partnerPage.getByRole('region', { name: '¿Quién debe a quién?' })).toContainText('Tú debes a Ana')
  })
  await test.step('Cerrar Luis sin afectar a Ana', async () => {
    await new ProfilePage(partnerPage).signOut()
    await expect(partnerPage).toHaveURL(/\/login$/)
    await partnerPage.goto('/expenses')
    await expect(partnerPage).toHaveURL(/\/login$/)
    await expensesPage.visit()
    await expect(expensesPage.row('Supermercado E2E')).toContainText('80,00')
    await expect(expensesPage.row('Gasolina E2E')).toContainText('40,00')
    await expect(expensesPage.row('Peluquería E2E')).toContainText('35,00')
  })
})
