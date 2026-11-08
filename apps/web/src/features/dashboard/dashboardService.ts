import type { MonthKey } from '../../lib/month'
import type { DashboardSummary } from './types'
import { http } from '../../services/api/http'
import { categoryKey } from '../expenses/expenseService'

export async function getDashboardSummary(spaceId: string, month: MonthKey): Promise<DashboardSummary | null> {
  const result = await http<DashboardSummary>(`/spaces/${spaceId}/summary?month=${month}`)
  if (!result.totalCents) return null
  return { ...result,
    categories: await Promise.all(result.categories.map(async (item) => ({ ...item, id: await categoryKey(item.id) }))),
    recentExpenses: await Promise.all(result.recentExpenses.map(async (item) => ({
      ...item, categoryId: await categoryKey(item.categoryId),
    }))),
  }
}
