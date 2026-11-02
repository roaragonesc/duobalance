import type { Page } from '@playwright/test'
import type { DemoUserKey } from '../data/demoUsers'

export class DemoPanel {
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async resetMockData() {
    await Promise.all([
      this.page.waitForEvent('domcontentloaded'),
      this.page.getByRole('button', { name: 'Restablecer datos de prueba' }).click(),
    ])
    await this.page.getByRole('complementary', { name: 'Modo mock de desarrollo' }).waitFor()
  }

  async selectUser(user: DemoUserKey | null) {
    await Promise.all([
      this.page.waitForEvent('domcontentloaded'),
      this.page.getByLabel('Usuario de prueba').selectOption(user ?? ''),
    ])
    await this.page.getByRole('complementary', { name: 'Modo mock de desarrollo' }).waitFor()
  }
}
