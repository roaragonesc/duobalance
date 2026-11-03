import { expect, test } from '../fixtures'
import { OnboardingPage } from '../pages/OnboardingPage'

test('TC10_rechazarUnTercerMiembro', async ({
  couple: _couple, page, partnerPage,
}) => {
  await test.step('TC47_intentarInvitarAUnaTerceraPersona', async () => {
    await page.goto('/onboarding/invite')
    await new OnboardingPage(page).invite('tercero.e2e@example.test')
    await expect(page.getByRole('alert')).toHaveText('Este espacio ya tiene dos miembros.')
  })
  await test.step('TC48_confirmarQueSoloPermanecenElPrimerUsuarioYElSegundoUsuario', async () => {
    for (const actor of [page, partnerPage]) {
      await actor.goto('/space')
      await expect(actor.getByRole('region', { name: 'Resumen del espacio' })).toContainText('2 de 2')
      await expect(actor.getByRole('region', { name: 'Miembros', exact: true }).getByRole('listitem')).toHaveCount(2)
      await expect(actor.getByRole('region', { name: 'Miembros', exact: true })).not.toContainText('tercero')
    }
  })
})
