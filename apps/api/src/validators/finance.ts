import { z } from 'zod'
import { email } from './auth.js'

export const id = z.string().regex(/^[a-f0-9]{24}$/i)
export const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)
export const date = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)
  .refine((value) => {
    const parsed = new Date(`${value}T12:00:00Z`)
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
  }, 'La fecha no existe.')
export const amountCents = z.number().int().positive().max(1_000_000_000)
const description = z.string().trim().min(1).max(160)
export const createSpace = z.strictObject({
  name: z.string().trim().min(1).max(80),
  splitMethod: z.enum(['equal', 'proportional']),
})
export const updateSpace = createSpace.partial().refine((value) => Object.keys(value).length > 0)
export const invite = z.strictObject({ email })
export const category = z.strictObject({
  name: z.string().trim().min(1).max(80),
  icon: z.enum(['food', 'housing', 'utilities', 'transport', 'leisure', 'health', 'other']),
  color: z.string().regex(/^#[a-f0-9]{6}$/i),
})
export const expense = z.strictObject({
  description, amountCents, date, categoryId: id,
  kind: z.enum(['shared', 'individual']),
})
export const income = z.strictObject({ description, amountCents, date })
export const settlement = z.strictObject({
  amountCents, date, note: z.string().trim().max(500).nullable().default(null),
})
export const monthQuery = z.strictObject({ month })
export const listQuery = z.strictObject({
  spaceId: id, month, kind: z.enum(['shared', 'individual']).optional(), categoryId: id.optional(),
})
