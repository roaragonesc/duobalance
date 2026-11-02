import { formatMonth, shiftMonth, type MonthKey } from '../../lib/month'
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from './icons'

type MonthSelectorProps = {
  month: MonthKey
  canGoNext: boolean
  onChange: (month: MonthKey) => void
}

const buttonClassName =
  'flex size-10 items-center justify-center rounded-full text-navy hover:bg-[#F1F7F9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-35'

export default function MonthSelector({
  month,
  canGoNext,
  onChange,
}: MonthSelectorProps) {
  return (
    <div
      role="group"
      aria-label="Mes consultado"
      className="flex items-center gap-2 rounded-full border border-[#E3EEF2] bg-white px-2 py-1.5 shadow-[0_4px_16px_rgba(11,32,56,0.05)]"
    >
      <button
        type="button"
        aria-label="Mes anterior"
        onClick={() => onChange(shiftMonth(month, -1))}
        className={buttonClassName}
      >
        <ChevronLeftIcon className="size-5" />
      </button>
      <p
        aria-live="polite"
        className="flex min-w-[170px] items-center justify-center gap-3 text-[17px] font-semibold text-navy"
      >
        {formatMonth(month)}
        <CalendarIcon className="size-5 text-[#56637F]" />
      </p>
      <button
        type="button"
        aria-label="Mes siguiente"
        onClick={() => onChange(shiftMonth(month, 1))}
        disabled={!canGoNext}
        className={buttonClassName}
      >
        <ChevronRightIcon className="size-5" />
      </button>
    </div>
  )
}
