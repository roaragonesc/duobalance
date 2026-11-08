import { Outlet } from 'react-router'

/** Centra las páginas claras de autenticación dentro del contenido principal accesible. */
export default function AuthLightLayout() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-ice px-4 py-8">
      <main
        id="main-content"
        tabIndex={-1}
        className="flex w-full justify-center focus:outline-none"
      >
        <Outlet />
      </main>
    </div>
  )
}
