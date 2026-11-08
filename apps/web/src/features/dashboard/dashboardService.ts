import type { MonthKey } from '../../lib/month'
import type { DashboardSummary } from './types'
import { http } from '../../services/api/http'
import { categoryKey, getCategoryKeys } from '../expenses/expenseService'
import { dashboardResponse } from '../../services/api/contracts'

/** Carga el resumen compartido y adapta categorías y movimientos con un único catálogo por carga. */
export async function getDashboardSummary(spaceId: string, month: MonthKey): Promise<DashboardSummary | null> {
  const result = await http(`/spaces/${spaceId}/summary?month=${month}`, dashboardResponse)
  if (!result.totalCents) return null
  const keys = await getCategoryKeys()
  return { ...result,
    categories: result.categories.map((item) => ({ ...item, id: categoryKey(item.id, keys) })),
    recentExpenses: result.recentExpenses.map((item) => ({
      ...item, categoryId: categoryKey(item.categoryId, keys),
    })),
  }
}
