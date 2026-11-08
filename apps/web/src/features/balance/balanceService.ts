import type { BalanceMonth, Settlement, SettlementInput, PendingBalance } from './types'
import { currentMonth, type MonthKey } from '../../lib/month'
import { http, HttpError } from '../../services/api/http'
import { balanceResponse, settlementsResponse, userResponse, settlementResponse } from '../../services/api/contracts'

/** Identifica el rechazo de un pago que supera la deuda para ofrecer instrucciones específicas. */
export class SettlementLimitError extends Error {
  /** Inicializa el error de límite de liquidación sin datos financieros privados. */
  constructor() {
    super('Settlement exceeds the pending debt')
    this.name = 'SettlementLimitError'
  }
}

/** Carga el balance y conserva la deuda anterior visible aunque no existan movimientos en el mes. */
export async function getMonthBalance(spaceId: string, month: MonthKey): Promise<BalanceMonth | null> {
  const result = await http(`/spaces/${spaceId}/balance?month=${month}`, balanceResponse)
  return result.summary.sharedExpensesCents || result.summary.incomesCents || result.settlements.length ||
    result.accumulated.amountCents ? result : null
}

/** Consulta la deuda acumulada actual antes de abrir el formulario de liquidación. */
export async function getPendingDebt(spaceId: string): Promise<PendingBalance> {
  return (await http(`/spaces/${spaceId}/balance?month=${currentMonth()}`, balanceResponse)).accumulated
}

/** Recupera el historial y adapta el pagador a la perspectiva de la sesión actual. */
export async function getSettlementHistory(spaceId: string): Promise<Settlement[]> {
  const [{ settlements }, { user }] = await Promise.all([
    http(`/spaces/${spaceId}/settlements`, settlementsResponse),
    http('/users/me', userResponse),
  ])
  return settlements.map((item) => ({
    id: item._id, date: item.date, note: item.note, amountCents: item.amountCents,
    paidBy: item.fromUserId === user.id ? 'me' : 'partner',
  }))
}

/** Registra un pago manual y traduce el conflicto de exceso de deuda a un error de dominio. */
export async function registerSettlement(spaceId: string, input: SettlementInput): Promise<void> {
  try {
    await http(`/spaces/${spaceId}/settlements`, settlementResponse, 'POST', input)
  } catch (error) {
    if (error instanceof HttpError && error.code === 'settlement_limit') throw new SettlementLimitError()
    throw error
  }
}

/** Produce el aviso de límite de deuda o un mensaje seguro para el resto de errores. */
export function getSettlementErrorMessage(error: unknown): string {
  if (error instanceof SettlementLimitError) {
    return 'El importe supera la deuda pendiente actual. Revisa el balance e inténtalo de nuevo.'
  }
  return error instanceof HttpError ? error.message : 'No se ha podido registrar la liquidación. Inténtalo de nuevo.'
}
