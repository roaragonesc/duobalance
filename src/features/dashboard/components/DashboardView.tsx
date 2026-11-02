import { Link } from 'react-router'
import RetryPanel from '../../../components/ui/RetryPanel'
import { UsersIcon } from '../../../components/ui/icons'
import type { AsyncState } from '../../../hooks/useAsyncData'
import { getMonthName, type MonthKey } from '../../../lib/month'
import type { DashboardSummary } from '../types'
import CategoryBreakdown from './CategoryBreakdown'
import MonthBalanceBar from './MonthBalanceBar'
import RecentExpenses from './RecentExpenses'
import SummaryCards from './SummaryCards'
import { IconTile, panelClassName } from '../../../components/ui/panel'

type DashboardViewProps = {
  state: AsyncState<DashboardSummary | null>
  month: MonthKey
  onRetry: () => void
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Cargando resumen del mes">
      <div aria-hidden="true" className="animate-pulse motion-reduce:animate-none">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className={`h-[130px] ${panelClassName}`} />
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className={`h-[300px] lg:col-span-7 ${panelClassName}`} />
          <div className={`h-[300px] lg:col-span-5 ${panelClassName}`} />
        </div>
      </div>
    </div>
  )
}

export default function DashboardView({
  state,
  month,
  onRetry,
}: DashboardViewProps) {
  if (state.status === 'loading') return <DashboardSkeleton />

  if (state.status === 'error') {
    return (
      <RetryPanel
        message="No se ha podido cargar el resumen del mes. Inténtalo de nuevo."
        onRetry={onRetry}
      />
    )
  }

  const summary = state.data
  if (!summary || summary.totalCents === 0) {
    return (
      <section
        aria-labelledby="empty-title"
        className={`flex flex-col items-center px-6 py-14 text-center ${panelClassName}`}
      >
        <IconTile>
          <UsersIcon className="size-7" />
        </IconTile>
        <h2 id="empty-title" className="mt-5 text-[22px] font-bold text-navy">
          Todavía no hay gastos en {getMonthName(month)}
        </h2>
        <p className="mt-2 max-w-md text-[16px] text-[#56637F]">
          Cuando registréis gastos compartidos verás aquí el resumen del mes,
          el reparto por categorías y el saldo pendiente.
        </p>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <SummaryCards summary={summary} month={month} />
      <div className="grid gap-6 lg:grid-cols-12">
        <CategoryBreakdown
          categories={summary.categories}
          totalCents={summary.totalCents}
        />
        <RecentExpenses expenses={summary.recentExpenses} month={month} />
      </div>
      <MonthBalanceBar summary={summary} />
    </div>
  )
}

export function PartnerPendingBanner() {
  return (
    <aside
      aria-labelledby="partner-pending-title"
      className="flex flex-col gap-4 rounded-[20px] border border-[#BFEBDD] bg-[#EFFBF7] p-5 sm:flex-row sm:items-center"
    >
      <div className="flex-1">
        <h2 id="partner-pending-title" className="text-[18px] font-bold text-navy">
          Tu pareja todavía no se ha unido
        </h2>
        <p className="text-[16px] text-[#3E4C63]">
          Invítala para empezar a compartir gastos.
        </p>
      </div>
      <Link
        to="/onboarding/invite"
        className="rounded-[12px] bg-navy px-5 py-2.5 text-center text-[16px] font-semibold text-white hover:bg-[#13304F]"
      >
        Invitar a tu pareja
      </Link>
    </aside>
  )
}
