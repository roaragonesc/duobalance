import { Outlet } from 'react-router'
import AuthBackdrop from '../../features/auth/components/AuthBackdrop'
import Logo from '../ui/Logo'

/** Layout oscuro de autenticación con marca, fondo decorativo y contenido de la ruta hija. */
export default function AuthLayout() {
  return (
    <div className="relative isolate flex min-h-dvh flex-col items-center justify-center bg-navy px-4 py-10">
      <AuthBackdrop />
      <header className="text-center">
        <Logo tone="onDark" />
        <p className="mt-2 text-[17px] text-white">
          Finanzas justas. Objetivos compartidos.
        </p>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mt-8 flex w-full justify-center focus:outline-none"
      >
        <Outlet />
      </main>
    </div>
  )
}
