import RetryPanel from '../../../components/ui/RetryPanel'
import { CheckCircleIcon } from '../../../components/ui/icons'
import type { AsyncState } from '../../../hooks/useAsyncData'
import { formatCents } from '../../../lib/money'
import { formatShortDate } from '../../../lib/month'
import type { Settlement } from '../types'

type SettlementsTableProps = {
  state: AsyncState<Settlement[] | null>
  caption: string
  emptyMessage: string
  partnerLabel: string
  showYear?: boolean
  onRetry: () => void
}

export default function SettlementsTable({
  state,
  caption,
  emptyMessage,
  partnerLabel,
  showYear = false,
  onRetry,
}: SettlementsTableProps) {
  if (state.status === 'loading') {
    return (
      <p role="status" className="py-6 text-[16px] text-[#56637F]">
        Cargando liquidaciones…
      </p>
    )
  }
  if (state.status === 'error') {
    return (
      <RetryPanel
        message="No se han podido cargar las liquidaciones. Inténtalo de nuevo."
        onRetry={onRetry}
      />
    )
  }
  const settlements = state.data ?? []
  if (settlements.length === 0) {
    return <p className="py-6 text-center text-[16px] text-[#56637F]">{emptyMessage}</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-[16px] text-navy">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-[#E3EEF2] text-left text-[15px] text-[#56637F]">
            <th scope="col" className="pb-3 font-medium">Fecha</th>
            <th scope="col" className="pb-3 font-medium">Concepto</th>
            <th scope="col" className="pb-3 font-medium">Pagado por</th>
            <th scope="col" className="pb-3 text-right font-medium">Importe</th>
            <th scope="col" className="pb-3 text-right font-medium">Estado</th>
          </tr>
        </thead>
        <tbody>
          {settlements.map((settlement) => (
            <tr key={settlement.id} className="border-b border-[#E3EEF2] last:border-b-0">
              <td className="py-3.5 pr-4 whitespace-nowrap text-[#56637F]">
                <time dateTime={settlement.date}>
                  {formatShortDate(settlement.date)}
                  {showYear && ` ${settlement.date.slice(0, 4)}`}
                </time>
              </td>
              <th scope="row" className="py-3.5 pr-4 text-left font-semibold">
                {settlement.note ?? 'Liquidación'}
              </th>
              <td className="py-3.5 pr-4">
                {settlement.paidBy === 'me' ? 'Tú' : partnerLabel}
              </td>
              <td className="py-3.5 pr-4 text-right font-bold whitespace-nowrap">
                {formatCents(settlement.amountCents)}
              </td>
              <td className="py-3.5 text-right">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E3F8F1] px-3 py-1 text-[14px] font-medium text-[#00704A]">
                  <CheckCircleIcon className="size-4" />
                  Liquidada
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}