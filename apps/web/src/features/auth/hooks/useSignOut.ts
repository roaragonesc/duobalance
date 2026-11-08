import { useRef, useState } from 'react'
import { getAuthErrorMessage } from '../services/authErrors'
import { signOut } from '../services/authService'

export function useSignOut() {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pendingRef = useRef(false)

  async function handleSignOut() {
    if (pendingRef.current) return
    pendingRef.current = true
    setIsSigningOut(true)
    setError(null)
    try {
      // Route guards react to the SIGNED_OUT event and redirect to /login.
      await signOut()
    } catch (signOutError) {
      setError(
        getAuthErrorMessage(
          signOutError,
          'No se ha podido cerrar la sesión. Inténtalo de nuevo.',
        ),
      )
    } finally {
      pendingRef.current = false
      setIsSigningOut(false)
    }
  }

  return { signOut: handleSignOut, isSigningOut, error }
}
