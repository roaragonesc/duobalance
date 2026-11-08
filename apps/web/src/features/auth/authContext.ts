import { createContext } from 'react'

export type AuthUser = {
  id: string
  email: string
  name: string
  createdAt: string
}

export type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; session: { user: AuthUser } }
  | { status: 'unauthenticated' }

export const AuthContext = createContext<AuthState | null>(null)
