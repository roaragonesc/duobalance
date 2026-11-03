import { useEffect, useState, type ReactNode } from 'react'
import { AuthContext, type AuthState } from '../features/auth/authContext'
import { http, HttpError } from './http'
import { authChanged, type ApiUser } from './authService'

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
        const { user } = await http<{ user: ApiUser }>('/auth/me')
        if (active && current === revision) {
          setError(null)
          setState({ status: 'authenticated', session: { user: {
            id: user.id, email: user.email, created_at: user.createdAt,
            app_metadata: { provider: 'api' }, user_metadata: { display_name: user.name }, aud: 'authenticated',
          } } })
        }
      } catch (caught) {
        if (!active || current !== revision) return
        if (caught instanceof HttpError && caught.status === 401) {
          setError(null)
          setState({ status: 'unauthenticated' })
        } else {
          console.error('No se pudo recuperar la sesión de la API.')
          setError('No se ha podido conectar con el servidor.')
        }
      }
    }
    void refresh()
    const listener = () => { void refresh() }
    window.addEventListener(authChanged, listener)
    return () => { active = false; window.removeEventListener(authChanged, listener) }
  }, [attempt])
  if (error) return <main><p role="alert">{error}</p><button onClick={() => setAttempt((value) => value + 1)}>Reintentar</button></main>
  return <AuthContext value={state}>{children}</AuthContext>
}
