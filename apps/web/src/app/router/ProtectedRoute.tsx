import { Navigate, Outlet, useLocation } from 'react-router'
import LoadingScreen from '../../components/ui/LoadingScreen'
import { useAuth } from '../../features/auth/hooks/useAuth'
import {
  AUTH_CALLBACK_PATH,
  type AuthLocationState,
} from '../../features/auth/navigation'
import { hasAuthLinkError } from '../../features/auth/services/authErrors'

// The provider validates the session; the API authorizes access to each resource.
export default function ProtectedRoute() {
  const auth = useAuth()
  const location = useLocation()

  // Failed email links (e.g. old ones pointing here) are explained on the callback page.
  if (hasAuthLinkError(location.search, location.hash)) {
    return (
      <Navigate
        to={`${AUTH_CALLBACK_PATH}${location.search}${location.hash}`}
        replace
      />
    )
  }

  if (auth.status === 'loading') {
    return <LoadingScreen label="Comprobando sesión…" />
  }

  if (auth.status === 'unauthenticated') {
    const state: AuthLocationState = {
      from: `${location.pathname}${location.search}`,
    }
    return <Navigate to="/login" replace state={state} />
  }

  return <Outlet />
}
