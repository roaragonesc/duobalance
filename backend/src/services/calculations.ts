import { ApiError } from '../utils/ApiError.js'

export function safeSum(values: number[]) {
  if (!values.every(Number.isSafeInteger)) throw new ApiError(422, 'amount_overflow', 'Un importe supera el límite seguro.')
  const total = Number(values.reduce((sum, value) => sum + BigInt(value), 0n))
  if (!Number.isSafeInteger(total)) throw new ApiError(422, 'amount_overflow', 'El importe acumulado supera el límite seguro.')
  return total
}

// Integer arithmetic avoids floating-point rounding in historical allocations.
export function allocation(amountCents: number, basisPoints: number): number {
  const result = Number((BigInt(amountCents) * BigInt(basisPoints) + 5000n) / 10000n)
  if (!Number.isSafeInteger(result)) throw new ApiError(422, 'amount_overflow', 'El reparto supera el límite seguro.')
  return result
}

export function proportionalBasis(ownerIncome: number, total: number) {
  return total === 0 ? 5000 : Number((BigInt(ownerIncome) * 10000n + BigInt(total) / 2n) / BigInt(total))
}

export function pending(debtToOwner: number, ownerId: string, viewerId: string) {
  return {
    amountCents: Math.abs(debtToOwner),
    debtor: debtToOwner === 0 ? null :
      ((debtToOwner > 0 ? ownerId !== viewerId : ownerId === viewerId) ? 'me' : 'partner'),
  }
}
