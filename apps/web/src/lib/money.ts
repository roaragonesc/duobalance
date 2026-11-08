const euros = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

// Amounts always travel as integer cents; euros exist only for display.
export function formatCents(cents: number): string {
  return euros.format(cents / 100)
}

export function formatShare(partCents: number, totalCents: number): string {
  if (totalCents <= 0 || partCents <= 0) return '0%'
  const percent = Math.round((partCents * 100) / totalCents)
  return percent === 0 ? '<1%' : `${percent}%`
}

const AMOUNT_PATTERN = /^(\d{1,7})(?:[.,](\d{1,2}))?$/

// Parses what the user types ("12", "12,5", "12.50") into integer cents
// without going through floating point. Returns null when it is not valid.
export function parseAmountToCents(value: string): number | null {
  const match = AMOUNT_PATTERN.exec(value.trim())
  if (!match) return null
  const [, euros, decimals = ''] = match
  return Number(euros) * 100 + Number(decimals.padEnd(2, '0'))
}