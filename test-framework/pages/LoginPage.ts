import type { Page } from '@playwright/test'

export class LoginPage {
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async visit() {
    await this.page.goto('/login')
  }

  async signIn(email: string, password: string) {
    await this.page.getByLabel('Correo electrónico').fill(email)
    await this.page.getByLabel('Contraseña', { exact: true }).fill(password)
    await this.submit()
  }

  async submit() {
    await this.page.getByRole('button', { name: 'Iniciar sesión' }).click()
  }
}
