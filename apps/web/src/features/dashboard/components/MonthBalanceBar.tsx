import { ScaleIcon } from '../../../components/ui/icons'
import { formatCents } from '../../../lib/money'
import type { DashboardSummary } from '../types'
import { IconTile, panelClassName } from '../../../components/ui/panel'
import { PendingStatus } from './SummaryCards'

export default function MonthBalanceBar({ summary }: { summary: DashboardSummary }) {
  const contributed =
    summary.myContributionCents + summary.partnerContributionCents
  return (
    <section
      aria-labelledby="month-balance-title"
      className={`flex flex-col gap-5 p-5 lg:flex-row lg:items-center ${panelClassName}`}
    >
      <div className="flex items-center gap-4 lg:flex-1">
        <IconTile>
          <ScaleIcon className="size-7" />
        </IconTile>
        <div>
          <h2 id="month-balance-title" className="text-[21px] font-bold text-navy">
            Balance del mes
          </h2>
          <p className="text-[16px] text-[#56637F]">Aportaciones y gastos</p>
        </div>
      </div>
      <dl className="flex gap-8 lg:border-x lg:border-[#E3EEF2] lg:px-8">
        <div>
          <dt className="text-[15px] text-[#56637F]">Aportado total</dt>
          <dd className="text-[24px] font-bold text-navy">
            {formatCents(contributed)}
          </dd>
        </div>
        <div>
          <dt className="text-[15px] text-[#56637F]">Gastos del mes</dt>
          <dd className="text-[24px] font-bold text-navy">
            {formatCents(summary.totalCents)}
          </dd>
        </div>
      </dl>
      <div className="rounded-full bg-[#EFFBF7] px-5 py-2.5">
        <PendingStatus pending={summary.pending} />
      </div>
    </section>
  )
}
