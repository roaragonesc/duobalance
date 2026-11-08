import { getInitials } from '../../../lib/initials'

type MemberAvatarsProps = {
  displayName: string
  memberCount: number
  partnerName: string | null
}

const avatarClassName =
  'flex size-12 items-center justify-center rounded-full text-[16px] font-bold'

export default function MemberAvatars({
  displayName,
  memberCount,
  partnerName,
}: MemberAvatarsProps) {
  return (
    <ul aria-label="Miembros del espacio" className="flex gap-2">
      <li title={`${displayName} (tú)`} className={`${avatarClassName} bg-[#E3F8F1] text-[#007A4D]`}>
        <span aria-hidden="true">{getInitials(displayName)}</span>
        <span className="sr-only">{displayName} (tú)</span>
      </li>
      {memberCount > 1 && (
        <li
          title={partnerName ?? 'Tu pareja'}
          className={`${avatarClassName} bg-[#E6F1FD] text-[#1E5FB3]`}
        >
          <span aria-hidden="true">{getInitials(partnerName ?? 'Pareja')}</span>
          <span className="sr-only">{partnerName ?? 'Tu pareja'}</span>
        </li>
      )}
    </ul>
  )
}
