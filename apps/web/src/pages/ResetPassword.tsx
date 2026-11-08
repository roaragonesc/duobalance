import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowLeftIcon, CheckIcon, LockIcon } from '../components/ui/icons'
import FormAlert from '../components/ui/FormAlert'
import AuthLightCard from '../features/auth/components/AuthLightCard'
import TextField from '../components/ui/TextField'
import PasswordRequirements from '../features/auth/components/PasswordRequirements'
import SubmitButton from '../components/ui/SubmitButton'
import { useAuth } from '../features/auth/hooks/useAuth'
import type { AuthLocationState } from '../features/auth/navigation'
import {
  getAuthErrorMessage,
  hasAuthLinkError,
} from '../features/auth/services/authErrors'
import { signOut, updatePassword } from '../features/auth/services/authService'
import {
  validateResetPassword,
  type ResetPasswordValues,
} from '../features/auth/validation'
import { useValidatedForm } from '../hooks/useValidatedForm'

const initialValues: ResetPasswordValues = { password: '', confirmPassword: '' }

const SUCCESS_STATE: AuthLocationState = {
  notice: 'Tu contraseña se ha actualizado. Inicia sesión con la nueva contraseña.',
}

function getResetPasswordErrorMessage(error: unknown) {
  return getAuthErrorMessage(
    error,
    'No se ha podido actualizar la contraseña. Inténtalo de nuevo.',
  )
}

export default function ResetPassword() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [linkFailed] = useState(() =>
    hasAuthLinkError(window.location.search, window.location.hash),
  )
  const apiRecovery = import.meta.env.VITE_DATA_MODE === 'api' &&
    /^[a-f0-9]{64}$/.test(new URLSearchParams(window.location.search).get('token') ?? '')
  const { values, errors, formError, isSubmitting, setValue, handleSubmit } =
    useValidatedForm({
      initialValues,
      validate: validateResetPassword,
      onSubmit: async ({ password }) => {
        await updatePassword(password)
        // Close the recovery session so the user signs in with the new password.
        await signOut().catch(() => undefined)
        navigate('/login', { replace: true, state: SUCCESS_STATE })
      },
      getErrorMessage: getResetPasswordErrorMessage,
    })

  const title = 'Establecer nueva contraseña'

  if (auth.status === 'loading') {
    return (
      <AuthLightCard title={title} description="Comprobando el enlace…">
        <title>{`${title} | DuoBalance`}</title>
        <p role="status" className="sr-only">
          Comprobando el enlace…
        </p>
      </AuthLightCard>
    )
  }

  if (linkFailed || (auth.status === 'unauthenticated' && !apiRecovery)) {
    return (
      <AuthLightCard
        title="Enlace no válido"
        description="El enlace para restablecer la contraseña no es válido o ha caducado. Solicita uno nuevo."
      >
        <title>Enlace no válido | DuoBalance</title>
        <Link
          to="/forgot-password"
          className="mt-8 flex h-[54px] w-full items-center justify-center rounded-[12px] bg-linear-to-b from-[#00A967] to-[#009A5F] text-[20px] font-bold text-white hover:from-[#009A5F] hover:to-[#008C56] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
        >
          Solicitar un nuevo enlace
        </Link>
        <Link
          to="/login"
          className="mt-8 inline-flex items-center gap-3 rounded-sm text-[19px] font-medium text-navy hover:underline"
        >
          <ArrowLeftIcon className="size-[22px]" />
          Volver al inicio de sesión
        </Link>
      </AuthLightCard>
    )
  }

  return (
    <AuthLightCard
      title={title}
      description="Crea una nueva contraseña para tu cuenta."
    >
      <title>{`${title} | DuoBalance`}</title>
      <form noValidate onSubmit={handleSubmit}>
        <FormAlert message={formError} />
        <div className="mt-7">
          <TextField
            id="password"
            label="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            icon={<LockIcon className="size-[26px]" />}
            value={values.password}
            onChange={(value) => setValue('password', value)}
            error={errors.password}
            describedBy="password-requirements"
            showLabel
            passwordToggle={{
              show: 'Mostrar nueva contraseña',
              hide: 'Ocultar nueva contraseña',
            }}
          />
          <PasswordRequirements
            id="password-requirements"
            password={values.password}
          />
        </div>
        <div className="mt-6">
          <TextField
            id="confirmPassword"
            label="Confirmar nueva contraseña"
            type="password"
            autoComplete="new-password"
            icon={<LockIcon className="size-[26px]" />}
            value={values.confirmPassword}
            onChange={(value) => setValue('confirmPassword', value)}
            error={errors.confirmPassword}
            showLabel
            passwordToggle={{
              show: 'Mostrar confirmación de contraseña',
              hide: 'Ocultar confirmación de contraseña',
            }}
          />
        </div>
        <SubmitButton
          label="Actualizar contraseña"
          loadingLabel="Actualizando contraseña…"
          isSubmitting={isSubmitting}
          variant="green"
          icon={<CheckIcon className="size-[26px]" />}
        />
      </form>
    </AuthLightCard>
  )
}
