import { Link } from 'react-router'
import { PlusIcon } from './icons'
import { currentMonth, type MonthKey } from '../../lib/month'

export const primaryActionClassName =
  'flex h-[54px] shrink-0 items-center justify-center gap-3 rounded-[14px] bg-linear-to-b from-[#00A967] to-[#009A5F] px-7 text-[19px] font-bold text-white shadow-[0_8px_18px_rgba(0,154,95,0.25)] hover:from-[#009A5F] hover:to-[#008C56] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-70'

type AddLinkProps = {
  to: string
  label: string
  /** Opening the form from a past month suggests a date inside that month. */
  month: MonthKey
}

export default function AddLink({ to, label, month }: AddLinkProps) {
  return (
    <Link
      to={month === currentMonth() ? to : `${to}?mes=${month}`}
      className={primaryActionClassName}
    >
      <PlusIcon className="size-6" />
      {label}
    </Link>
  )
}