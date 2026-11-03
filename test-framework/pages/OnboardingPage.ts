import type { Page } from '@playwright/test'

export type SplitChoice = 'equal' | 'proportional'

export class OnboardingPage {
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async createSpace(name: string, splitMethod: SplitChoice) {
    await this.page.getByLabel('Nombre del espacio').fill(name)
    await this.page
      .getByRole('radio', { name: splitMethod === 'equal' ? '50/50' : 'Proporcional' })
      .check()
    await this.page.getByRole('button', { name: 'Crear espacio' }).click()
  }

  async invite(email: string) {
    await this.page.getByLabel('Correo electrónico').fill(email)
    await this.page.getByRole('button', { name: 'Crear invitación' }).click()
  }
}
