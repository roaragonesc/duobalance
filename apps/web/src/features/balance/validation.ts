import { collectErrors, type FieldErrors } from '../../hooks/useValidatedForm'
import { amountToCents, validateAmount, validatePastDate } from '../../lib/formValidation'
import { formatCents } from '../../lib/money'
import { todayIso } from '../../lib/month'
import type { SettlementInput } from './types'

export const SETTLEMENT_NOTE_MAX_LENGTH = 80

export type SettlementFormValues = {
  amount: string
  date: string
  note: string
}

// Settlements are manual, may be partial and never exceed the pending debt.
export function validateSettlement(
  values: SettlementFormValues,
  pendingCents: number,
  today = todayIso(),
): FieldErrors<SettlementFormValues> {
  let amount = validateAmount(values.amount)
  if (!amount && amountToCents(values.amount) > pendingCents) {
    amount = `El importe no puede superar la deuda pendiente (${formatCents(pendingCents)}).`
  }
  return collectErrors<SettlementFormValues>({
    amount,
    date: validatePastDate(values.date, today),
    note:
      values.note.trim().length > SETTLEMENT_NOTE_MAX_LENGTH
        ? `La nota no puede superar los ${SETTLEMENT_NOTE_MAX_LENGTH} caracteres.`
        : undefined,
  })
}

export function toSettlementInput(values: SettlementFormValues): SettlementInput {
  const note = values.note.trim()
  return {
    amountCents: amountToCents(values.amount),
    date: values.date,
    note: note || null,
  }
}

export function formatShareBasisPoints(basisPoints: number): string {
  return `${(basisPoints / 100).toLocaleString('es-ES', { maximumFractionDigits: 2 })} %`
}