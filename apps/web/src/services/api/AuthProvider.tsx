import { useEffect, useState, type ReactNode } from 'react'
import { AuthContext, type AuthState } from '../../features/auth/authContext'
import { http, HttpError, ApiResponseError, sessionExpired } from './http'
import { userResponse } from './contracts'
import { authChanged } from '../../features/auth/services/authService'

/** Restaura la sesión por cookie, escucha acceso/caducidad y ofrece reintento ante fallos de la API. */
export default function ApiAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    let revision = 0
    const refresh = async () => {
      const current = ++revision
      try {
        const { user } = await http('/auth/me', userResponse)
        if (active && current === revision) {
          setError(null)
          setState({ status: 'authenticated', session: { user: {
            id: user.id, email: user.email, name: user.name, createdAt: user.createdAt,
          } } })
        }
      } catch (caught) {
        if (!active || current !== revision) return
        if (caught instanceof HttpError && caught.status === 401) {
          setError(null)
          setState({ status: 'unauthenticated' })
        } else {
          console.error('No se pudo recuperar la sesión de la API.')
          setError(caught instanceof ApiResponseError ? caught.message : 'No se ha podido conectar con el servidor.')
        }
      }
    }
    void refresh()
    const listener = () => { void refresh() }
    const expire = () => {
      revision++
      setError(null)
      setState({ status: 'unauthenticated' })
    }
    window.addEventListener(authChanged, listener)
    window.addEventListener(sessionExpired, expire)
    return () => {
      active = false
      window.removeEventListener(authChanged, listener)
      window.removeEventListener(sessionExpired, expire)
    }
  }, [attempt])
  if (error) return <main><p role="alert">{error}</p><button onClick={() => setAttempt((value) => value + 1)}>Reintentar</button></main>
  return <AuthContext value={state}>{children}</AuthContext>
}
