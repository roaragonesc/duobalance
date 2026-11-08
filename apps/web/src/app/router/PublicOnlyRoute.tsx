import { Navigate, Outlet, useLocation } from 'react-router'
import LoadingScreen from '../../components/ui/LoadingScreen'
import { useAuth } from '../../features/auth/hooks/useAuth'
import {
  DEFAULT_AUTHENTICATED_PATH,
  readAuthLocationState,
} from '../../features/auth/navigation'

/** Restringe páginas públicas de acceso a usuarios sin sesión y redirige a los autenticados. */
export default function PublicOnlyRoute() {
  const auth = useAuth()
  const location = useLocation()

  if (auth.status === 'loading') {
    return <LoadingScreen label="Comprobando sesión…" />
  }

  if (auth.status === 'authenticated') {
    const { from } = readAuthLocationState(location.state)
    return <Navigate to={from ?? DEFAULT_AUTHENTICATED_PATH} replace />
  }

  return <Outlet />
}
