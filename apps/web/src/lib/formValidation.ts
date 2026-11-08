import { parseAmountToCents } from './money'

// Field validators shared by the money forms. Each returns the Spanish error
// message or undefined when the value is valid.

export const CONCEPT_MAX_LENGTH = 80
export const MAX_AMOUNT_CENTS = 100_000_000
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function validateConcept(value: string): string | undefined {
  const concept = value.trim()
  if (!concept) return 'El concepto es obligatorio.'
  if (concept.length > CONCEPT_MAX_LENGTH) {
    return `El concepto no puede superar los ${CONCEPT_MAX_LENGTH} caracteres.`
  }
  return undefined
}

export function validateAmount(value: string): string | undefined {
  if (!value.trim()) return 'El importe es obligatorio.'
  const cents = parseAmountToCents(value)
  if (cents === null) return 'Introduce un importe válido, por ejemplo 12,50.'
  if (cents <= 0) return 'El importe debe ser mayor que 0.'
  if (cents > MAX_AMOUNT_CENTS) return 'El importe no puede superar 1.000.000 €.'
  return undefined
}

function isValidDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getMonth() === month - 1 && date.getDate() === day
}

export function validatePastDate(value: string, today: string): string | undefined {
  if (!isValidDate(value)) return 'Introduce una fecha válida.'
  if (value > today) return 'La fecha no puede ser posterior a hoy.'
  return undefined
}

// "1234,5" -> 123450; call only after validateAmount returned undefined.
export function amountToCents(value: string): number {
  return parseAmountToCents(value) ?? 0
}

// 123450 -> "1234,50", the value shown when editing an amount.
export function centsToAmountInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',')
}