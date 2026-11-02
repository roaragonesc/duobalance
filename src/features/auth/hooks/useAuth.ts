import { use } from 'react'
import { AuthContext, type AuthState } from '../authContext'

export function useAuth(): AuthState {
  const state = use(AuthContext)
  if (!state) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.')
  }
  return state
}
