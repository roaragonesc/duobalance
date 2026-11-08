import type { Expense, ExpenseInput, ExpenseMonth, ExpenseCategoryId } from './types'
import type { MonthKey } from '../../lib/month'
import { http, HttpError } from '../../services/api/http'
import { categoriesResponse, expensesResponse, expenseResponse, userResponse, noContent } from '../../services/api/contracts'

/** Carga el catálogo una vez y relaciona IDs de MongoDB con claves/iconos usados por la UI. */
export async function getCategoryKeys(): Promise<ReadonlyMap<string, ExpenseCategoryId>> {
  const { categories } = await http('/categories', categoriesResponse)
  return new Map(categories.map((category) => [category._id, category.key ?? category.icon]))
}

/** Traduce una categoría al catálogo visual; las personales ajenas usan el icono genérico. */
export function categoryKey(id: string, keys: ReadonlyMap<string, ExpenseCategoryId>): ExpenseCategoryId {
  // Partner-owned categories may be visible in summaries but not in the user's catalogue.
  return keys.get(id) ?? 'other'
}

/** Resuelve la categoría global para guardar un gasto y falla explícitamente si falta el seed. */
async function categoryId(key: ExpenseCategoryId): Promise<string> {
  const { categories } = await http('/categories', categoriesResponse)
  const category = categories.find((item) => item.key === key)
  if (!category) throw new Error('La categoría global no está disponible. Ejecuta el seed de desarrollo.')
  return category._id
}

/** Obtiene gastos y totales del mes, adaptando categorías sin una petición adicional por cada gasto. */
export async function getMonthExpenses(spaceId: string, month: MonthKey): Promise<ExpenseMonth | null> {
  const result = await http(`/spaces/${spaceId}/expenses?month=${month}`, expensesResponse)
  if (!result.expenses.length) return null
  const keys = await getCategoryKeys()
  return { ...result, expenses: result.expenses.map((item) => ({
    ...item, categoryId: categoryKey(item.categoryId, keys),
  })) }
}

/** Adapta un gasto visible con pagador relativo y permiso de edición; un 404 devuelve null. */
export async function getExpense(id: string): Promise<Expense | null> {
  try {
    const [{ expense }, { user }] = await Promise.all([
      http(`/expenses/${id}`, expenseResponse), http('/users/me', userResponse),
    ])
    return {
      id: expense._id, description: expense.description, amountCents: expense.amountCents,
      date: expense.date, kind: expense.kind, categoryId: categoryKey(expense.categoryId, await getCategoryKeys()),
      paidBy: expense.paidBy === user.id ? 'me' : 'partner', canEdit: expense.createdBy === user.id,
    }
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) return null
    throw error
  }
}

/** Crea o edita un gasto enviando la categoría real; la identidad y el reparto los deriva el servidor. */
export async function saveExpense(spaceId: string, input: ExpenseInput, id?: string): Promise<void> {
  const data = { ...input, categoryId: await categoryId(input.categoryId), ...(!id ? { spaceId } : {}) }
  await http(id ? `/expenses/${id}` : '/expenses', expenseResponse, id ? 'PATCH' : 'POST', data)
}

/** Solicita el borrado del gasto y exige una respuesta sin contenido. */
export async function deleteExpense(id: string): Promise<void> {
  await http(`/expenses/${id}`, noContent, 'DELETE')
}

/** Selecciona el mensaje HTTP público o el mensaje de error seguro de la pantalla. */
export function getExpenseErrorMessage(error: unknown, fallback: string): string {
  return error instanceof HttpError ? error.message : fallback
}
