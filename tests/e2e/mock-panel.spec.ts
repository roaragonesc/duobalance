import { expect, test } from '../fixtures'

test('TC20_plegarYDesplegarElPanelMockConTeclado', async ({ page }) => {
  const panel = page.getByRole('complementary', { name: 'Modo mock de desarrollo' })

  await test.step('Ocultar los controles mediante el teclado', async () => {
    const hide = panel.getByRole('button', { name: 'Ocultar panel mock' })
    await expect(hide).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByLabel('Usuario de prueba')).toBeVisible()
    await hide.focus()
    await hide.press('Enter')
    await expect(panel.getByRole('button', { name: 'Mostrar panel mock' })).toBeFocused()
    await expect(panel.getByRole('button', { name: 'Mostrar panel mock' })).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByLabel('Usuario de prueba')).toBeHidden()
    await expect(panel.getByRole('button', { name: 'Restablecer datos de prueba', includeHidden: true })).toBeHidden()
  })

  await test.step('Volver a mostrar los controles con la barra espaciadora', async () => {
    await panel.getByRole('button', { name: 'Mostrar panel mock' }).press('Space')
    await expect(panel.getByRole('button', { name: 'Ocultar panel mock' })).toBeFocused()
    await expect(panel.getByRole('button', { name: 'Ocultar panel mock' })).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByLabel('Usuario de prueba')).toBeVisible()
    await expect(panel.getByRole('button', { name: 'Restablecer datos de prueba' })).toBeVisible()
  })
})
