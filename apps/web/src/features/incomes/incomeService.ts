import type { Income, IncomeInput, IncomeMonth } from './types'
import type { MonthKey } from '../../lib/month'
import { http, HttpError } from '../../services/api/http'
import { incomesResponse, incomeResponse, userResponse, noContent } from '../../services/api/contracts'

/** Consulta ingresos y totales mensuales de ambos miembros; null indica un mes sin ingresos. */
export async function getMonthIncomes(spaceId: string, month: MonthKey): Promise<IncomeMonth | null> {
  const result = await http(`/spaces/${spaceId}/incomes?month=${month}`, incomesResponse)
  return result.incomes.length ? result : null
}

/** Carga un ingreso para editar solo si pertenece a la sesión actual; los ajenos no se presentan como propios. */
export async function getOwnIncome(id: string): Promise<Income | null> {
  try {
    const [{ income }, { user }] = await Promise.all([
      http(`/incomes/${id}`, incomeResponse),
      http('/users/me', userResponse),
    ])
    if (income.createdBy !== user.id) return null
    return { id: income._id, description: income.description, date: income.date, amountCents: income.amountCents, owner: 'me' }
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) return null
    throw error
  }
}

/** Crea o actualiza un ingreso; el backend determina y autoriza su propietario desde la sesión. */
export async function saveIncome(spaceId: string, input: IncomeInput, id?: string): Promise<void> {
  await http(id ? `/incomes/${id}` : '/incomes', incomeResponse, id ? 'PATCH' : 'POST', { ...input, ...(!id ? { spaceId } : {}) })
}

/** Solicita eliminar un ingreso propio y valida la respuesta 204. */
export async function deleteIncome(id: string): Promise<void> {
  await http(`/incomes/${id}`, noContent, 'DELETE')
}

/** Obtiene un mensaje público de error sin mostrar datos de la respuesta inválida. */
export function getIncomeErrorMessage(error: unknown, fallback: string): string {
  return error instanceof HttpError ? error.message : fallback
}
