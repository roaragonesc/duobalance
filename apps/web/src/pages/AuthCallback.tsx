import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import FormAlert from '../components/ui/FormAlert'
import { ArrowLeftIcon, CheckIcon } from '../components/ui/icons'
import AuthLightCard from '../features/auth/components/AuthLightCard'
import ResendConfirmation from '../features/auth/components/ResendConfirmation'
import { useAuth } from '../features/auth/hooks/useAuth'
import {
  DEFAULT_AUTHENTICATED_PATH,
  readSafePath,
} from '../features/auth/navigation'
import {
  getAuthLinkError,
  getAuthErrorMessage,
  toAuthLinkError,
  type AuthLinkError,
} from '../features/auth/services/authErrors'
import { HttpError } from '../services/api/http'
import {
  confirmEmail,
  type EmailConfirmationType,
} from '../features/auth/services/authService'
import { getCurrentSpaceId } from '../features/spaces/services/spaceService'

const LINK_ERROR_COPY: Record<AuthLinkError, { title: string; description: string }> = {
  expired: {
    title: 'Enlace caducado o ya utilizado',
    description:
      'Este enlace de confirmación ha caducado o ya se ha usado. Si ya confirmaste tu correo, inicia sesión; si no, solicita un enlace nuevo.',
  },
  invalid: {
    title: 'Enlace no válido',
    description:
      'Este enlace de confirmación no es válido. Solicita un enlace nuevo con el correo con el que te registraste.',
  },
}

const CONFIRMATION_TYPES: readonly EmailConfirmationType[] = ['signup', 'email']

type CallbackParams = {
  error: AuthLinkError | null
  tokenHash: string | null
  type: EmailConfirmationType | null
  next: string | undefined
}

function readCallbackParams(search: string, hash: string): CallbackParams {
  const query = new URLSearchParams(search)
  const type = query.get('type')
  return {
    error: getAuthLinkError(search, hash),
    tokenHash: query.get('token_hash'),
    type: CONFIRMATION_TYPES.find((value) => value === type) ?? null,
    next: readSafePath(query.get('next')),
  }
}

const primaryClassName =
  'mt-8 flex h-[54px] w-full items-center justify-center gap-3 rounded-[12px] bg-linear-to-b from-[#00A967] to-[#009A5F] text-[20px] font-bold text-white hover:from-[#009A5F] hover:to-[#008C56] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-70'

const secondaryClassName =
  'mt-8 inline-flex items-center gap-3 rounded-sm text-[19px] font-medium text-navy hover:underline'

/** Confirma el correo por clic explícito y dirige al espacio adecuado, mostrando errores recuperables. */
export default function AuthCallback() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useState(() =>
    readCallbackParams(location.search, location.hash),
  )
  const [linkError, setLinkError] = useState<AuthLinkError | null>(params.error)
  const [isConfirming, setIsConfirming] = useState(false)
  const [confirmationError, setConfirmationError] = useState<string | null>(null)
  const [workspaceError, setWorkspaceError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const userId = auth.status === 'authenticated' ? auth.session.user.id : null

  useEffect(() => {
    if (!userId || linkError) return
    let active = true
    getCurrentSpaceId(userId)
      .then((spaceId) => {
        if (!active) return
        const target =
          params.next &&
          params.next !== DEFAULT_AUTHENTICATED_PATH &&
          params.next !== '/onboarding'
            ? params.next
            : spaceId
              ? DEFAULT_AUTHENTICATED_PATH
              : '/onboarding'
        navigate(target, { replace: true })
      })
      .catch(() => {
        if (!active) return
        console.error('No se pudo consultar el espacio tras la autenticación.')
        setWorkspaceError('No se ha podido cargar tu espacio. Inténtalo de nuevo.')
      })
    return () => {
      active = false
    }
  }, [userId, linkError, params.next, navigate, attempt])

  // Explicit click so link scanners in email clients cannot consume the token.
  async function confirm() {
    if (isConfirming || !params.tokenHash || !params.type) return
    setIsConfirming(true)
    setConfirmationError(null)
    try {
      await confirmEmail(params.tokenHash, params.type)
    } catch (error) {
      if (error instanceof HttpError && ['invalid_token', 'token_expired'].includes(error.code)) {
        setLinkError(toAuthLinkError(error))
      } else {
        setConfirmationError(getAuthErrorMessage(error, 'No se ha podido confirmar el correo. Inténtalo de nuevo.'))
      }
      setIsConfirming(false)
    }
  }

  const error =
    linkError ??
    (auth.status === 'unauthenticated' && !params.tokenHash
      ? 'invalid'
      : null)

  if (workspaceError) {
    return (
      <AuthLightCard title="No se ha podido cargar tu espacio" description="Comprueba la conexión e inténtalo de nuevo.">
        <FormAlert message={workspaceError} />
        <button type="button" className={primaryClassName} onClick={() => {
          setWorkspaceError(null)
          setAttempt((value) => value + 1)
        }}>
          Reintentar
        </button>
      </AuthLightCard>
    )
  }
  if (error) {
    const { title, description } = LINK_ERROR_COPY[error]
    return (
      <AuthLightCard title={title} description={description}>
        <title>{`${title} | DuoBalance`}</title>
        <ResendConfirmation redirectPath={params.next} />
        <Link to="/login" className={secondaryClassName}>
          <ArrowLeftIcon className="size-[22px]" />
          Ir al inicio de sesión
        </Link>
      </AuthLightCard>
    )
  }

  if (auth.status === 'unauthenticated' && params.tokenHash) {
    const title = 'Confirma tu correo'
    return (
      <AuthLightCard
        title={title}
        description="Pulsa el botón para activar tu cuenta de DuoBalance."
      >
        <title>{`${title} | DuoBalance`}</title>
        <FormAlert message={params.type ? confirmationError : 'Este enlace de confirmación no es válido.'} />
        <button
          type="button"
          onClick={confirm}
          disabled={isConfirming || !params.type}
          className={primaryClassName}
        >
          <CheckIcon className="size-[26px]" />
          {isConfirming ? 'Confirmando correo…' : 'Confirmar mi correo'}
        </button>
      </AuthLightCard>
    )
  }

  const title = 'Confirmando tu correo'
  const message =
    auth.status === 'authenticated'
      ? 'Correo confirmado. Preparando tu espacio…'
      : 'Comprobando el enlace…'
  return (
    <AuthLightCard title={title} description={message}>
      <title>{`${title} | DuoBalance`}</title>
      <p role="status" className="sr-only">
        {message}
      </p>
    </AuthLightCard>
  )
}
