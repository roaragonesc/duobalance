import type { DashboardSummary } from '../features/dashboard/types'
import { http } from './http'
import { categoryKey } from './expenseService'

export async function getDashboardSummary(spaceId: string, month: string): Promise<DashboardSummary | null> {
  const result = await http<DashboardSummary>(`/spaces/${spaceId}/summary?month=${month}`)
  if (!result.totalCents) return null
  return { ...result,
    categories: await Promise.all(result.categories.map(async (item) => ({ ...item, id: await categoryKey(item.id) }))),
    recentExpenses: await Promise.all(result.recentExpenses.map(async (item) => ({ ...item, categoryId: await categoryKey(item.categoryId) }))),
  }
}
