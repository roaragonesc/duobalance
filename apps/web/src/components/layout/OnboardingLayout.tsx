import { Link, Outlet, useMatches } from 'react-router'
import SignOutButton from '../../features/auth/components/SignOutButton'
import { ArrowLeftIcon } from '../ui/icons'
import Logo from '../ui/Logo'
import MintWave from '../ui/MintWave'

export type OnboardingRouteHandle = {
  backTo: string
}

function getBackTo(handle: unknown): string | undefined {
  if (typeof handle !== 'object' || handle === null) return undefined
  const { backTo } = handle as Partial<OnboardingRouteHandle>
  return typeof backTo === 'string' ? backTo : undefined
}

/** Compone el alta del espacio con marca, vuelta según la ruta, cierre de sesión y contenido del paso. */
export default function OnboardingLayout() {
  const backTo = useMatches()
    .map((match) => getBackTo(match.handle))
    .findLast(Boolean)

  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-ice px-4 pt-5 pb-28 sm:px-8">
      <MintWave className="-z-10 h-[110px] sm:h-[130px]" />
      <header className="relative">
        {backTo && (
          <Link
            to={backTo}
            className="absolute top-1 left-0 flex size-[52px] items-center justify-center rounded-full bg-white text-navy shadow-[0_2px_8px_rgba(11,32,56,0.08)] transition-colors hover:bg-[#F5F7FB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy motion-reduce:transition-none sm:left-6"
          >
            <span className="sr-only">Volver</span>
            <ArrowLeftIcon className="size-[24px]" strokeWidth={2.2} />
          </Link>
        )}
        <Logo tone="onLight" />
        <SignOutButton className="absolute top-2 right-0 text-navy sm:right-6" />
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-[1100px] flex-1 focus:outline-none"
      >
        <Outlet />
      </main>
    </div>
  )
}
