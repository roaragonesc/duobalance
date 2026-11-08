import { useMemo, type ReactNode } from 'react'
import { AuthContext, type AuthState } from '../src/features/auth/authContext'
import { demoUserId, useDemoState } from './demoStore'

function createAuthState(user: string | null, users: ReturnType<typeof useDemoState>['users']): AuthState {
  const account = user ? users[user] : null
  if (!account) return { status: 'unauthenticated' }

  const session = {
    user: {
      id: demoUserId(account.key),
      email: account.email,
      name: account.name,
      createdAt: account.createdAt,
    },
  }
  return { status: 'authenticated', session }
}

export default function MockAuthProvider({ children }: { children: ReactNode }) {
  const { user, users } = useDemoState()
  const authState = useMemo(() => createAuthState(user, users), [user, users])
  return <AuthContext value={authState}>{children}</AuthContext>
}
