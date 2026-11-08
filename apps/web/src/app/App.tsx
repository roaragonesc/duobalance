import { RouterProvider } from 'react-router/dom'
import AuthProvider from './providers/AuthProvider'
import { router } from './router/router'

/** Monta autenticación y router e incluye el enlace accesible para saltar al contenido principal. */
export default function App() {
  return (
    <AuthProvider>
      <a
        href="#main-content"
        onClick={(event) => {
          if (import.meta.env.MODE === 'pages-demo') {
            event.preventDefault()
            document.getElementById('main-content')?.focus()
          }
        }}
        className="sr-only z-50 rounded-lg bg-mint px-4 py-3 font-semibold text-navy focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Saltar al contenido
      </a>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
