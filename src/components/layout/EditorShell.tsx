import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowLeftIcon } from '../ui/icons'
import { panelClassName } from '../ui/panel'

type EditorShellProps = {
  backTo: string
  backLabel: string
  title: string
  children: ReactNode
}

// Frame of the create/edit form pages of the app screens.
export default function EditorShell({ backTo, backLabel, title, children }: EditorShellProps) {
  return (
    <div className="mx-auto max-w-[720px] space-y-6">
      <Link
        to={backTo}
        className="inline-flex items-center gap-2 rounded-sm text-[16px] font-semibold text-[#007A4D] hover:underline"
      >
        <ArrowLeftIcon className="size-5" />
        {backLabel}
      </Link>
      <h1 className="text-[32px] leading-tight font-bold text-navy">{title}</h1>
      <section aria-label={title} className={`p-6 sm:p-8 ${panelClassName}`}>
        {children}
      </section>
    </div>
  )
}