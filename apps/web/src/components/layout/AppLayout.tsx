import { useCallback, useState } from 'react'
import { Link, Navigate, NavLink, Outlet } from 'react-router'
import { appScreens } from '../../app/router/screens'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { getCurrentWorkspace } from '../../features/spaces/services/spaceService'
import type { ActiveWorkspace } from '../../features/spaces/workspaceContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import LoadingScreen from '../ui/LoadingScreen'
import Logo from '../ui/Logo'
import RetryPanel from '../ui/RetryPanel'
import { ChevronRightIcon, HomeIcon } from '../ui/icons'

function formatMembers(count: number) {
  return count === 1 ? '1 miembro' : `${count} miembros`
}

export default function AppLayout() {
  const auth = useAuth()
  const userId = auth.status === 'authenticated' ? auth.session.user.id : ''
  const load = useCallback(() => getCurrentWorkspace(userId), [userId])
  const { state, reload } = useAsyncData(load)
  const [renamed, setRenamed] = useState<string | null>(null)

  if (state.status === 'loading') {
    return <LoadingScreen label="Cargando tu espacio…" />
  }

  if (state.status === 'error') {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-ice px-4">
        <RetryPanel
          className="w-full max-w-md"
          message="No se ha podido cargar tu espacio. Comprueba tu conexión e inténtalo de nuevo."
          onRetry={reload}
        />
      </main>
    )
  }

  const { displayName, space } = state.data
  // App screens only make sense inside a shared space.
  if (!space) return <Navigate to="/onboarding" replace />

  const workspace: ActiveWorkspace = {
    displayName: renamed ?? displayName,
    space,
    setDisplayName: setRenamed,
  }

  return (
    <div className="min-h-dvh bg-[#F7FBFC] lg:flex">
      <aside className="border-b border-[#E3EEF2] bg-white px-4 py-5 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-[270px] lg:shrink-0 lg:flex-col lg:overflow-y-auto lg:border-r lg:border-b-0 lg:px-6 lg:py-8">
        <header className="flex items-center justify-between lg:block">
          <Link
            to="/dashboard"
            aria-label="DuoBalance, inicio"
            className="block rounded-xl"
          >
            <Logo
              tone="onLight"
              className="mx-0! w-[130px]! lg:mx-auto! lg:w-[165px]!"
            />
          </Link>
        </header>
        <nav aria-label="Navegación principal" className="mt-5 lg:mt-10">
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-1 lg:gap-3">
            {appScreens.map(({ path, title, icon: Icon }) => (
              <li key={path} className="min-w-0">
                <NavLink
                  to={path}
                  end={path === '/dashboard'}
                  className={({ isActive }) =>
                    `flex min-h-11 flex-col items-center gap-1 rounded-[14px] px-2 py-2 text-[13px] transition-colors motion-reduce:transition-none sm:text-[14px] lg:flex-row lg:gap-4 lg:px-5 lg:py-3.5 lg:text-[18px] ${
                      isActive
                        ? 'bg-[#E3F8F1] font-bold text-navy'
                        : 'font-medium text-[#3E4C63] hover:bg-[#F1F7F9]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`size-6 shrink-0 ${isActive ? 'text-[#00A967]' : 'text-[#4A5871]'}`}
                      />
                      <span className="truncate">{title}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto hidden pt-8 lg:block">
          <Link
            to="/space"
            className="flex items-center gap-3 rounded-[16px] bg-[#EFFBF7] px-4 py-3.5 text-navy hover:bg-[#E3F8F1]"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-white text-[#00A967]">
              <HomeIcon className="size-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[17px] font-bold">
                {space.name}
              </span>
              <span className="block text-[14px] text-[#56637F]">
                {formatMembers(space.memberCount)}
              </span>
            </span>
            <ChevronRightIcon className="size-5 shrink-0" />
          </Link>
        </div>
      </aside>
      <main
        id="main-content"
        tabIndex={-1}
        className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-10 lg:py-9"
      >
        <Outlet context={workspace} />
      </main>
    </div>
  )
}
