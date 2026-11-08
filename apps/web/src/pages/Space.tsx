import { Link } from 'react-router'
import MonthPageHeader from '../components/layout/MonthPageHeader'
import { HomeIcon, MailIcon, ScaleIcon, UsersIcon } from '../components/ui/icons'
import { IconTile, panelClassName } from '../components/ui/panel'
import { useAuth } from '../features/auth/hooks/useAuth'
import { getInitials } from '../lib/initials'
import SplitMethodForm from '../features/spaces/components/SplitMethodForm'
import { updateSplitMethod } from '../features/spaces/services/spaceService'
import { getSplitMethodLabel } from '../features/spaces/splitMethods'
import { useActiveWorkspace } from '../features/spaces/workspaceContext'

const MAX_MEMBERS = 2

const sectionTitleClassName = 'text-[21px] font-bold text-navy'

function MemberRow({
  name,
  detail,
  isMe,
  share,
}: {
  name: string
  detail: string | null
  isMe: boolean
  share: string | null
}) {
  return (
    <li className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
      <span
        aria-hidden="true"
        className={`flex size-12 shrink-0 items-center justify-center rounded-full text-[16px] font-bold ${
          isMe ? 'bg-[#E3F8F1] text-[#007A4D]' : 'bg-[#E6F1FD] text-[#1E5FB3]'
        }`}
      >
        {getInitials(name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-[17px] font-bold text-navy">
          {name}
          {isMe && (
            <span className="rounded-full bg-[#E3F8F1] px-2.5 py-0.5 text-[13px] font-semibold text-[#00704A]">
              Tú
            </span>
          )}
        </p>
        {detail && <p className="truncate text-[15px] text-[#56637F]">{detail}</p>}
      </div>
      {share && (
        <span className="rounded-full bg-[#E3F8F1] px-3 py-1 text-[15px] font-bold text-[#00704A]">
          {share}
        </span>
      )}
    </li>
  )
}

export default function Space() {
  const { displayName, space } = useActiveWorkspace()
  const auth = useAuth()
  const email = auth.status === 'authenticated' ? (auth.session.user.email ?? null) : null
  const hasPartner = space.memberCount >= MAX_MEMBERS
  const share = space.splitMethod === 'equal' ? '50 %' : null

  let invitation
  if (hasPartner) {
    invitation = (
      <p className="text-[16px] text-[#56637F]">
        El espacio está completo: admite como máximo dos miembros.
      </p>
    )
  } else if (space.role === 'owner') {
    invitation = (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-3 text-[16px] text-[#56637F]">
          <MailIcon className="size-6 shrink-0 text-navy" />
          Invita a tu pareja para empezar a compartir gastos.
        </p>
        <Link
          to="/onboarding/invite"
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-[14px] border-2 border-[#00A967] px-5 text-[16px] font-semibold text-[#007A4D] hover:bg-[#EFFBF7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
        >
          Enviar invitación
        </Link>
      </div>
    )
  } else {
    invitation = (
      <p className="text-[16px] text-[#56637F]">
        Solo quien creó el espacio puede enviar invitaciones.
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <MonthPageHeader
        title="Espacio compartido"
        description="Gestiona los miembros, invitaciones y la configuración del espacio."
        showMonth={false}
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <section
          aria-labelledby="space-name"
          className={`flex items-center gap-5 p-6 lg:col-span-7 ${panelClassName}`}
        >
          <IconTile>
            <HomeIcon className="size-8" />
          </IconTile>
          <div>
            <h2 id="space-name" className="text-[26px] font-bold text-navy">
              {space.name}
            </h2>
            <p className="text-[16px] text-[#56637F]">Tu espacio compartido</p>
          </div>
        </section>
        <section aria-label="Resumen del espacio" className={`p-6 lg:col-span-5 ${panelClassName}`}>
          <dl className="grid grid-cols-2 gap-4 text-navy">
            <div className="flex items-center gap-3">
              <UsersIcon className="size-8 shrink-0 text-[#00A967]" />
              <div>
                <dt className="text-[15px] text-[#56637F]">Miembros</dt>
                <dd className="text-[18px] font-bold">
                  {space.memberCount} de {MAX_MEMBERS}
                </dd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ScaleIcon className="size-8 shrink-0 text-[#00A967]" />
              <div>
                <dt className="text-[15px] text-[#56637F]">Reparto actual</dt>
                <dd className="text-[18px] font-bold">{getSplitMethodLabel(space.splitMethod)}</dd>
              </div>
            </div>
          </dl>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <section aria-labelledby="members-title" className={`p-6 ${panelClassName}`}>
            <h2 id="members-title" className={sectionTitleClassName}>
              Miembros
            </h2>
            <ul className="mt-4 divide-y divide-[#E3EEF2]">
              <MemberRow name={displayName} detail={email} isMe share={share} />
              {hasPartner && (
                <MemberRow
                  name={space.partnerName ?? 'Tu pareja'}
                  detail={null}
                  isMe={false}
                  share={share}
                />
              )}
            </ul>
            {!hasPartner && (
              <p className="mt-4 text-[15px] text-[#56637F]">
                Tu pareja todavía no se ha unido al espacio.
              </p>
            )}
          </section>
          <section aria-labelledby="invitations-title" className={`p-6 ${panelClassName}`}>
            <h2 id="invitations-title" className={`mb-4 ${sectionTitleClassName}`}>
              Invitaciones
            </h2>
            {invitation}
          </section>
        </div>
        <section
          aria-labelledby="split-title"
          className={`p-6 lg:col-span-5 ${panelClassName}`}
        >
          <h2 id="split-title" className={sectionTitleClassName}>
            Método de reparto
          </h2>
          <p className="mt-1 mb-5 text-[16px] text-[#56637F]">
            Define cómo se reparten los gastos compartidos del espacio.
          </p>
          <SplitMethodForm
            current={space.splitMethod}
            onSubmit={(method) => updateSplitMethod(space.id, method)}
          />
        </section>
      </div>
    </div>
  )
}