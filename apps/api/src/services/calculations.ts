import { ApiError } from '../utils/ApiError.js'

/** Suma céntimos mediante BigInt y rechaza entradas o resultados fuera del entero seguro. */
export function safeSum(values: number[]) {
  if (!values.every(Number.isSafeInteger)) throw new ApiError(422, 'amount_overflow', 'Un importe supera el límite seguro.')
  const total = Number(values.reduce((sum, value) => sum + BigInt(value), 0n))
  if (!Number.isSafeInteger(total)) throw new ApiError(422, 'amount_overflow', 'El importe acumulado supera el límite seguro.')
  return total
}

/** Asigna la parte histórica en puntos básicos, redondeando al céntimo sin coma flotante. */
export function allocation(amountCents: number, basisPoints: number): number {
  const result = Number((BigInt(amountCents) * BigInt(basisPoints) + 5000n) / 10000n)
  if (!Number.isSafeInteger(result)) throw new ApiError(422, 'amount_overflow', 'El reparto supera el límite seguro.')
  return result
}

/** Convierte los ingresos del creador en puntos básicos; sin ingresos usa un reparto 50/50. */
export function proportionalBasis(ownerIncome: number, total: number) {
  return total === 0 ? 5000 : Number((BigInt(ownerIncome) * 10000n + BigInt(total) / 2n) / BigInt(total))
}

/** Traduce la deuda con signo a importe positivo y deudor relativo al usuario que consulta. */
export function pending(debtToOwner: number, ownerId: string, viewerId: string) {
  return {
    amountCents: Math.abs(debtToOwner),
    debtor: debtToOwner === 0 ? null :
      ((debtToOwner > 0 ? ownerId !== viewerId : ownerId === viewerId) ? 'me' : 'partner'),
  }
}
