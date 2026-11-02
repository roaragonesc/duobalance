import { RouterProvider } from 'react-router/dom'
import { router } from './routes/router'

export default function App() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-mint px-4 py-3 font-semibold text-navy focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Saltar al contenido
      </a>
      <RouterProvider router={router} />
    </>
  )
}
