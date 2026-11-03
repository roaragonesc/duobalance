// Mock expenses are stored in insertion order; the latest entry wins date ties.
export function sortExpensesNewestFirst<T extends { date: string }>(expenses: readonly T[]): T[] {
  return expenses.toReversed().sort((a, b) => b.date.localeCompare(a.date))
}
