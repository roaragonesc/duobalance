import { useCallback } from 'react'
import MonthPageHeader from '../components/layout/MonthPageHeader'
import { getDashboardSummary } from '../features/dashboard/dashboardService'
import DashboardView, {
  PartnerPendingBanner,
} from '../features/dashboard/components/DashboardView'
import { useActiveWorkspace } from '../features/spaces/workspaceContext'
import { useAsyncData } from '../hooks/useAsyncData'
import { useMonthParam } from '../hooks/useMonthParam'

/** Carga el resumen del mes y saluda al usuario, mostrando la invitación pendiente cuando falta su pareja. */
export default function Dashboard() {
  const { displayName, space } = useActiveWorkspace()
  const { month } = useMonthParam()

  const load = useCallback(
    () => getDashboardSummary(space.id, month),
    [space.id, month],
  )
  const { state, reload } = useAsyncData(load)

  const firstName = displayName.split(/\s+/)[0] || displayName

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <MonthPageHeader
        title={
          <>
            Hola, {firstName} <span aria-hidden="true">👋</span>
          </>
        }
        description={`Resumen de ${space.name}`}
      />
      {space.memberCount < 2 && space.role === 'owner' && (
        <PartnerPendingBanner />
      )}
      <DashboardView state={state} month={month} onRetry={reload} />
    </div>
  )
}
