import { record, services } from './serviceState'

export function getSupabaseClient() {
  return {
    auth: {
      async signUp(input: unknown) {
        record('signUp', input)
        return { data: { session: null }, error: null }
      },
      async resend(input: unknown) {
        record('resend', input)
        return { data: {}, error: services.options.error === 'network' ? new Error('rate limit') : null }
      },
    },
  }
}
