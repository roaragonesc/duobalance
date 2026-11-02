// Navigation state shared between auth screens and route guards.
export type AuthLocationState = {
  from?: string
  notice?: string
}

// Only same-origin paths: rejects "//host" and "/\\host", which browsers treat as external.
export function readSafePath(value: unknown): string | undefined {
  return typeof value === 'string' && /^\/(?![/\\])/.test(value)
    ? value
    : undefined
}

export function readAuthLocationState(state: unknown): AuthLocationState {
  if (typeof state !== 'object' || state === null) return {}
  const { from, notice } = state as Record<string, unknown>
  return {
    from: readSafePath(from),
    notice: typeof notice === 'string' ? notice : undefined,
  }
}

// Users without a space are sent from here to the onboarding by AppLayout.
export const DEFAULT_AUTHENTICATED_PATH = '/dashboard'

// Landing page of every Supabase email link that confirms an account.
export const AUTH_CALLBACK_PATH = '/auth/callback'
