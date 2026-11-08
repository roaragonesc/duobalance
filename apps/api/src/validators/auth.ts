import { z } from 'zod'

export const email = z.string().trim().toLowerCase().pipe(z.email().max(254))
export const displayName = z.string().trim().min(1).max(80)
const password = z.string().min(8).max(128)
  .regex(/\p{Lu}/u).regex(/\p{Ll}/u).regex(/\d/)

export const registration = z.strictObject({ name: displayName, email, password })
export const credentials = z.strictObject({ email, password: z.string().min(1).max(128) })
export const emailRequest = z.strictObject({ email })
export const token = z.string().regex(/^[a-f0-9]{64}$/)
export const confirmation = z.strictObject({ token })
export const resetPassword = z.strictObject({ token, password })
export const profileUpdate = z.strictObject({ name: displayName })
export const userSearch = z.strictObject({ email })
