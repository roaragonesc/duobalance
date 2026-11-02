import { NavLink, Outlet } from 'react-router'
import { appScreens } from '../../routes/screens'
import Brand from './Brand'

export default function AppLayout() {
  return (
    <div className="min-h-dvh bg-ice lg:flex">
      <aside className="bg-navy px-4 py-6 text-ice lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:shrink-0 lg:overflow-y-auto">
        <header>
          <Brand />
          <p className="mt-2 px-3 text-sm">Órbita Nexo</p>
        </header>
        <nav aria-label="Navegación principal" className="mt-6">
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {appScreens.map(({ path, title }) => (
              <li key={path} className="min-w-0">
                <NavLink
                  to={path}
                  end
                  className={({ isActive }) =>
                    `flex min-h-11 items-center rounded-xl px-3 py-3 text-sm ${
                      isActive
                        ? 'bg-mint font-bold text-navy'
                        : 'text-ice hover:bg-white/10'
                    }`
                  }
                >
                  {title}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main
        id="main-content"
        tabIndex={-1}
        className="min-w-0 flex-1 p-6 sm:p-10 lg:p-12"
      >
        <Outlet />
      </main>
    </div>
  )
}
