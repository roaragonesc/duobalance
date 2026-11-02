import type { Page } from '@playwright/test'
import type { DemoUserKey } from '../data/demoUsers'

export class DemoPanel {
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async resetMockData() {
    await this.page.getByRole('button', { name: 'Restablecer datos de prueba' }).click()
  }

  async selectUser(user: DemoUserKey | null) {
    await this.page.getByLabel('Usuario de prueba').selectOption(user ?? '')
  }
}
