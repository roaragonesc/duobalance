import type { Income, IncomeInput, IncomeMonth } from '../features/incomes/types'
import { http, HttpError } from './http'
export { getIncomeErrorMessage } from '../features/incomes/incomeService'

export async function getMonthIncomes(spaceId: string, month: string): Promise<IncomeMonth | null> {
  const result = await http<IncomeMonth>(`/spaces/${spaceId}/incomes?month=${month}`)
  return result.incomes.length ? result : null
}
export async function getOwnIncome(id: string): Promise<Income | null> {
  try {
    const [{ income }, { user }] = await Promise.all([
      http<{ income: { _id: string; createdBy: string; description: string; date: string; amountCents: number } }>(`/incomes/${id}`),
      http<{ user: { id: string } }>('/users/me'),
    ])
    if (income.createdBy !== user.id) return null
    return { id: income._id, description: income.description, date: income.date, amountCents: income.amountCents, owner: 'me' }
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) return null
    throw error
  }
}
export async function saveIncome(spaceId: string, input: IncomeInput, id?: string): Promise<void> {
  await http(id ? `/incomes/${id}` : '/incomes', id ? 'PATCH' : 'POST', { ...input, ...(!id ? { spaceId } : {}) })
}
export async function deleteIncome(id: string): Promise<void> { await http(`/incomes/${id}`, 'DELETE') }
