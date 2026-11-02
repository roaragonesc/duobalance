import { Outlet } from 'react-router'
import Brand from './Brand'

export default function AuthLayout() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-navy px-4 py-10">
      <header className="text-center">
        <Brand />
        <p className="mt-2 text-sm text-ice">Órbita Nexo</p>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="w-full max-w-md rounded-3xl bg-ice p-6 text-center shadow-xl sm:p-10"
      >
        <Outlet />
      </main>
    </div>
  )
}
