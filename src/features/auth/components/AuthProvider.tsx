import { useEffect, useState, type ReactNode } from 'react'
import {
  getSupabaseClient,
  isSupabaseConfigured,
} from '../../../lib/supabase/client'
import { AuthContext, type AuthState } from '../authContext'

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() =>
    isSupabaseConfigured ? { status: 'loading' } : { status: 'unauthenticated' },
  )

  useEffect(() => {
    if (!isSupabaseConfigured) return

    // INITIAL_SESSION fires once the client has restored the stored session
    // and processed any auth code in the URL, so routes wait for it.
    const {
      data: { subscription },
    } = getSupabaseClient().auth.onAuthStateChange((_event, session) => {
      setState(
        session
          ? { status: 'authenticated', session }
          : { status: 'unauthenticated' },
      )
    })

    return () => subscription.unsubscribe()
  }, [])

  return <AuthContext value={state}>{children}</AuthContext>
}
