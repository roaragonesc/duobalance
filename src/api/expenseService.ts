import type { Expense, ExpenseInput, ExpenseMonth, ExpenseCategoryId } from '../features/expenses/types'
import { isCategoryId } from '../features/expenses/categories'
import { http, HttpError } from './http'
export { ExpensesUnavailableError, getExpenseErrorMessage } from '../features/expenses/expenseService'

type Category = { _id: string; key?: string; icon: string }
type RawExpense = {
  _id: string; description: string; amountCents: number; date: string; categoryId: string;
  kind: 'shared' | 'individual'; paidBy: string; createdBy: string
}
export async function categoryKey(id: string): Promise<ExpenseCategoryId> {
  const { categories } = await http<{ categories: Category[] }>('/categories')
  const category = categories.find((item) => item._id === id)
  const key = category?.key ?? category?.icon ?? 'other'
  return isCategoryId(key) ? key : 'other'
}
async function categoryId(key: ExpenseCategoryId): Promise<string> {
  const { categories } = await http<{ categories: Category[] }>('/categories')
  const category = categories.find((item) => item.key === key)
  if (!category) throw new Error('La categoría global no está disponible. Ejecuta el seed de desarrollo.')
  return category._id
}
export async function getMonthExpenses(spaceId: string, month: string): Promise<ExpenseMonth | null> {
  const result = await http<ExpenseMonth>(`/spaces/${spaceId}/expenses?month=${month}`)
  if (!result.expenses.length) return null
  return { ...result, expenses: await Promise.all(result.expenses.map(async (item) => ({
    ...item, categoryId: await categoryKey(item.categoryId),
  }))) }
}
export async function getExpense(id: string): Promise<Expense | null> {
  try {
    const [{ expense }, { user }] = await Promise.all([
      http<{ expense: RawExpense }>(`/expenses/${id}`), http<{ user: { id: string } }>('/users/me'),
    ])
    return {
      id: expense._id, description: expense.description, amountCents: expense.amountCents,
      date: expense.date, kind: expense.kind, categoryId: await categoryKey(expense.categoryId),
      paidBy: expense.paidBy === user.id ? 'me' : 'partner', canEdit: expense.createdBy === user.id,
    }
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) return null
    throw error
  }
}
export async function saveExpense(spaceId: string, input: ExpenseInput, id?: string): Promise<void> {
  const data = { ...input, categoryId: await categoryId(input.categoryId), ...(!id ? { spaceId } : {}) }
  await http(id ? `/expenses/${id}` : '/expenses', id ? 'PATCH' : 'POST', data)
}
export async function deleteExpense(id: string): Promise<void> { await http(`/expenses/${id}`, 'DELETE') }
