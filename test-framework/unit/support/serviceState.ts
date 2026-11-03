import { AuthError } from '@supabase/supabase-js'

export type ServiceOptions = {
  spaceId?: string | null
  error?: 'expired' | 'rate' | 'network'
}

export const services: {
  options: ServiceOptions
  calls: Record<string, unknown[][]>
} = { options: {}, calls: {} }

export function resetServices(options: ServiceOptions) {
  services.options = options
  services.calls = {}
}

export function record(name: string, ...args: unknown[]) {
  ;(services.calls[name] ??= []).push(args)
}

export function serviceError() {
  if (services.options.error === 'expired') {
    throw new AuthError('Token has expired or is invalid', 403, 'otp_expired')
  }
  if (services.options.error === 'rate') {
    throw new AuthError('rate limit', 429, 'over_email_send_rate_limit')
  }
  if (services.options.error === 'network') throw new Error('Network unavailable')
}

Object.assign(window, { unitServices: services })
