import { CheckCircleIcon, CircleIcon } from '../../../components/ui/icons'
import { PASSWORD_RULES } from '../validation'

type PasswordRequirementsProps = {
  id: string
  password: string
}

export default function PasswordRequirements({
  id,
  password,
}: PasswordRequirementsProps) {
  return (
    <ul
      id={id}
      aria-label="Requisitos de la contraseña"
      className="mt-3 space-y-[7px] pl-3 text-left text-[16px] text-[#3E4B6B]"
    >
      {PASSWORD_RULES.map((rule) => {
        const isMet = rule.test(password)
        return (
          <li key={rule.label} className="flex items-center gap-3">
            {isMet ? (
              <CheckCircleIcon className="size-[20px] shrink-0 text-[#12A150]" />
            ) : (
              <CircleIcon className="size-[20px] shrink-0 text-[#9AA4B8]" />
            )}
            <span>
              {rule.label}
              <span className="sr-only">
                {isMet ? ' (cumplido)' : ' (pendiente)'}
              </span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
