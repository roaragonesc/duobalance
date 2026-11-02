import type { Page } from '@playwright/test'

export type Registration = { name: string; email: string; password: string }

export class RegisterPage {
  constructor(privatePage: Page) {
    this.page = privatePage
  }

  private readonly page: Page

  async register(user: Registration, confirmation = user.password) {
    await this.page.getByLabel('Nombre', { exact: true }).fill(user.name)
    await this.page.getByLabel('Correo electrónico').fill(user.email)
    await this.page.getByLabel('Contraseña', { exact: true }).fill(user.password)
    await this.page.getByLabel('Confirmar contraseña', { exact: true }).fill(confirmation)
    await this.page.getByRole('button', { name: 'Crear cuenta' }).click()
  }

  async confirm(email: string) {
    await this.page.getByRole('link', { name: `Confirmar correo de ${email}` }).click()
    await this.page.getByRole('button', { name: 'Confirmar mi correo' }).click()
    await this.page.waitForURL((url) => ['/onboarding', '/join'].includes(url.pathname))
  }
}
