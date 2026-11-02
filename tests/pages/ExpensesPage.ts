import type { Page } from '@playwright/test'

type ExpenseInput = {
  description: string
  amount: string
  individual?: boolean
}

export class ExpensesPage {
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async addExpense({ description, amount, individual = false }: ExpenseInput) {
    await this.page.getByRole('link', { name: 'Añadir gasto' }).click()
    await this.page.getByLabel('Concepto').fill(description)
    await this.page.getByLabel('Importe (€)').fill(amount)
    await this.page.getByLabel('Categoría').selectOption('food')
    if (individual) {
      await this.page.getByRole('radio', { name: /Individual/ }).check()
    }
    await this.page.getByRole('button', { name: 'Añadir gasto' }).click()
  }
}
