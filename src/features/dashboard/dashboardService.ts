import type { MonthKey } from '../../lib/month'
import type { DashboardSummary } from './types'

// The expenses, incomes and settlements tables arrive in the next phases.
// Until then there is no financial data, so the dashboard shows its empty
// state. This will become an RPC that calculates the summary in PostgreSQL.
export async function getDashboardSummary(
  _spaceId: string,
  _month: MonthKey,
): Promise<DashboardSummary | null> {
  return null
}
