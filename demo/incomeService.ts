import type { MonthKey } from '../src/lib/month'
import type { Income, IncomeInput, IncomeMonth } from '../src/features/incomes/types'
import { demoDelay, hasSampleData } from './demoStore'
import {
  incomes,
  inMonth,
  newId,
  persistDemoMovements,
  sum,
  toMember,
  viewer,
  type SampleIncome,
} from './sampleData'

export { getIncomeErrorMessage } from '../src/features/incomes/incomeService'

function toIncome({ by, ...income }: SampleIncome): Income {
  return { ...income, owner: toMember(by) }
}

export async function getMonthIncomes(spaceId: string, month: MonthKey): Promise<IncomeMonth | null> {
  await demoDelay()
  if (!hasSampleData(spaceId)) return null
  const list = incomes
    .filter((income) => inMonth(income.date, month))
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(toIncome)
  const myCents = sum(list.filter((income) => income.owner === 'me'))
  return { totalCents: sum(list), myCents, partnerCents: sum(list) - myCents, incomes: list }
}

export async function getOwnIncome(id: string): Promise<Income | null> {
  await demoDelay()
  const income = incomes.find((candidate) => candidate.id === id && candidate.by === viewer())
  return income ? toIncome(income) : null
}

// Each member manages only their own incomes.
function ownIncomeIndex(id: string) {
  const index = incomes.findIndex((income) => income.id === id && income.by === viewer())
  if (index === -1) throw new Error('Not allowed')
  return index
}

export async function saveIncome(_spaceId: string, input: IncomeInput, id?: string): Promise<void> {
  await demoDelay()
  if (id) {
    const index = ownIncomeIndex(id)
    incomes[index] = { ...incomes[index], ...input }
  } else {
    incomes.push({ ...input, id: newId('inc'), by: viewer() })
  }
  persistDemoMovements()
}

export async function deleteIncome(id: string): Promise<void> {
  await demoDelay()
  incomes.splice(ownIncomeIndex(id), 1)
  persistDemoMovements()
}
