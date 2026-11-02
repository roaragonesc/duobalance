import type { Page } from '@playwright/test'

export class ProfilePage {
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async signOut() {
    await this.page.getByRole('link', { name: 'Mi perfil' }).click()
    await this.page.getByRole('button', { name: 'Cerrar sesión' }).click()
  }
}
