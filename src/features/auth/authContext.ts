import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; session: Pick<Session, 'user'> }
  | { status: 'unauthenticated' }

export const AuthContext = createContext<AuthState | null>(null)
