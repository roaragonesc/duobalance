import type { ReactNode } from 'react'
import MonthSelector from '../ui/MonthSelector'
import MemberAvatars from '../../features/spaces/components/MemberAvatars'
import { useActiveWorkspace } from '../../features/spaces/workspaceContext'
import { useMonthParam } from '../../hooks/useMonthParam'

type MonthPageHeaderProps = {
  title: ReactNode
  description: string
  /** Screens that do not depend on the month hide the selector. */
  showMonth?: boolean
}

// Header of the app screens: title, month selector and members.
export default function MonthPageHeader({
  title,
  description,
  showMonth = true,
}: MonthPageHeaderProps) {
  const { displayName, space } = useActiveWorkspace()
  const { month, setMonth, isCurrentMonth } = useMonthParam()

  return (
    <header className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
      <div>
        <h1 className="text-[32px] leading-tight font-bold text-navy">{title}</h1>
        <p className="mt-1 text-[18px] text-[#56637F]">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {showMonth && (
          <MonthSelector month={month} canGoNext={!isCurrentMonth} onChange={setMonth} />
        )}
        <MemberAvatars
          displayName={displayName}
          memberCount={space.memberCount}
          partnerName={space.partnerName}
        />
      </div>
    </header>
  )
}
