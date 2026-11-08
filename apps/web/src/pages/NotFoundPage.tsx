import { Link } from 'react-router'

/** Explica una ruta inexistente y ofrece volver al inicio. */
export default function NotFoundPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-navy">Página no encontrada</h1>
      <Link
        to="/"
        className="inline-flex rounded-xl bg-mint px-5 py-3 font-semibold text-navy hover:bg-mint/80"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
