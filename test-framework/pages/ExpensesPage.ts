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
    await this.page.waitForURL((url) => url.pathname === '/expenses')
  }

  row(description: string) {
    return this.page.getByRole('row').filter({
      has: this.page.getByRole('rowheader', { name: description, exact: true }),
    })
  }

  async visit() {
    await this.page.goto('/expenses')
  }

  async editAmount(description: string, amount: string) {
    const edit = this.row(description).getByRole('link', { name: `Editar ${description}` })
    await edit.focus()
    await edit.press('Enter')
    await this.page.getByLabel('Importe (€)').fill(amount)
    await this.page.getByRole('button', { name: 'Guardar cambios' }).click()
    await this.page.waitForURL((url) => url.pathname === '/expenses')
  }
}
