import { Outlet } from 'react-router'
import Brand from './Brand'

export default function SimpleLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-ice">
      <header className="px-4 py-6 sm:px-8">
        <Brand />
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-4 py-10 text-center sm:px-8"
      >
        <Outlet />
      </main>
    </div>
  )
}
