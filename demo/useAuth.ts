import type { Session } from '@supabase/supabase-js'
import type { AuthState } from '../src/features/auth/authContext'
import { demoUserId, demoUsers, useDemoState } from './demoStore'

export function useAuth(): AuthState {
  const { user } = useDemoState()
  if (!user) return { status: 'unauthenticated' }
  const email = demoUsers.find((candidate) => candidate.key === user)?.email
  // Only the fields the app reads from the session.
  const session = { user: { id: demoUserId(user), email } } as unknown as Session
  return { status: 'authenticated', session }
}
