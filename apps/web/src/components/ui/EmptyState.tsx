import type { ReactNode } from 'react'
import { IconTile, panelClassName } from './panel'

type EmptyStateProps = {
  id: string
  icon: ReactNode
  title: string
  children: ReactNode
  action?: ReactNode
}

export default function EmptyState({ id, icon, title, children, action }: EmptyStateProps) {
  return (
    <section
      aria-labelledby={id}
      className={`flex flex-col items-center px-6 py-14 text-center ${panelClassName}`}
    >
      <IconTile>{icon}</IconTile>
      <h2 id={id} className="mt-5 text-[22px] font-bold text-navy">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-[16px] text-[#56637F]">{children}</p>
      {action && <div className="mt-7">{action}</div>}
    </section>
  )
}
