import { useMemo, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AuthContext, type AuthState } from '../src/features/auth/authContext'
import { demoUserId, useDemoState } from './demoStore'

function createAuthState(user: string | null, users: ReturnType<typeof useDemoState>['users']): AuthState {
  const account = user ? users[user] : null
  if (!account) return { status: 'unauthenticated' }

  const session: Session = {
    access_token: `mock-access-${account.key}`,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'mock-refresh-token',
    user: {
      id: demoUserId(account.key),
      email: account.email,
      app_metadata: { provider: 'mock', providers: ['mock'] },
      user_metadata: { display_name: account.name },
      aud: 'authenticated',
      created_at: account.createdAt,
    },
  }
  return { status: 'authenticated', session }
}

export default function MockAuthProvider({ children }: { children: ReactNode }) {
  const { user, users } = useDemoState()
  const authState = useMemo(() => createAuthState(user, users), [user, users])
  return <AuthContext value={authState}>{children}</AuthContext>
}
