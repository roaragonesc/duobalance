import { Link } from 'react-router'

export default function Brand() {
  return (
    <Link
      to="/"
      aria-label="DuoBalance, inicio"
      className="inline-block rounded-xl bg-navy px-3 py-2 text-2xl font-bold text-white"
    >
      Duo<span className="text-mint">Balance</span>
    </Link>
  )
}
