import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import FormAlert from '../components/ui/FormAlert'
import { ArrowLeftIcon, CheckIcon } from '../components/ui/icons'
import AuthLightCard from '../features/auth/components/AuthLightCard'
import { useAuth } from '../features/auth/hooks/useAuth'
import type { AuthLocationState } from '../features/auth/navigation'
import { getSpaceErrorMessage } from '../features/spaces/services/spaceErrors'
import {
  acceptInvitation,
  INVITATION_PATH,
} from '../features/spaces/services/spaceService'

const primaryClassName =
  'mt-8 flex h-[54px] w-full items-center justify-center gap-3 rounded-[12px] bg-linear-to-b from-[#00A967] to-[#009A5F] text-[20px] font-bold text-white hover:from-[#009A5F] hover:to-[#008C56] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-70'

const secondaryClassName =
  'mt-8 inline-flex items-center gap-3 rounded-sm text-[19px] font-medium text-navy hover:underline'

/** Gestiona el acceso por invitación, exige sesión y acepta el enlace únicamente tras un clic explícito. */
export default function JoinSpace() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const title = 'Únete a vuestro espacio'

  // Acceptance requires an explicit click, never a side effect of visiting the link.
  async function join() {
    if (isJoining) return
    setIsJoining(true)
    setError(null)
    try {
      await acceptInvitation(token)
      navigate('/dashboard', { replace: true })
    } catch (caught) {
      setError(
        getSpaceErrorMessage(
          caught,
          'No se ha podido aceptar la invitación. Inténtalo de nuevo.',
        ),
      )
      setIsJoining(false)
    }
  }

  if (!/^[0-9a-f]{64}$/.test(token)) {
    return (
      <AuthLightCard
        title="Enlace no válido"
        description="Este enlace de invitación no es válido. Pide a tu pareja que te envíe uno nuevo."
      >
        <title>Enlace no válido | DuoBalance</title>
        <Link to="/login" className={secondaryClassName}>
          <ArrowLeftIcon className="size-[22px]" />
          Volver al inicio de sesión
        </Link>
      </AuthLightCard>
    )
  }

  if (auth.status === 'loading') {
    return (
      <AuthLightCard title={title} description="Comprobando sesión…">
        <title>{`${title} | DuoBalance`}</title>
        <p role="status" className="sr-only">
          Comprobando sesión…
        </p>
      </AuthLightCard>
    )
  }

  if (auth.status === 'unauthenticated') {
    const state: AuthLocationState = {
      from: `${INVITATION_PATH}?token=${token}`,
    }
    return (
      <AuthLightCard
        title={title}
        description="Tu pareja te ha invitado a DuoBalance. Inicia sesión o crea una cuenta con el correo al que se envió la invitación."
      >
        <title>{`${title} | DuoBalance`}</title>
        <Link to="/login" state={state} className={primaryClassName}>
          Iniciar sesión
        </Link>
        <Link to="/register" state={state} className={secondaryClassName}>
          Crear una cuenta
        </Link>
      </AuthLightCard>
    )
  }

  return (
    <AuthLightCard
      title={title}
      description="Acepta la invitación para compartir gastos con tu pareja."
    >
      <title>{`${title} | DuoBalance`}</title>
      <FormAlert message={error} />
      <button
        type="button"
        onClick={join}
        disabled={isJoining}
        className={primaryClassName}
      >
        <CheckIcon className="size-[26px]" />
        {isJoining ? 'Uniéndote al espacio…' : 'Aceptar invitación'}
      </button>
    </AuthLightCard>
  )
}