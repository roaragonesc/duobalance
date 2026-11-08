import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { readAuthLocationState } from '../features/auth/navigation'
import AuthCard from '../features/auth/components/AuthCard'
import ResendConfirmation from '../features/auth/components/ResendConfirmation'
import FormAlert from '../components/ui/FormAlert'
import StatusMessage from '../components/ui/StatusMessage'
import TextField from '../components/ui/TextField'
import { LockIcon, MailIcon, UserIcon } from '../components/ui/icons'
import SubmitButton from '../components/ui/SubmitButton'
import { getAuthErrorMessage } from '../features/auth/services/authErrors'
import { signUp } from '../features/auth/services/authService'
import { useValidatedForm } from '../hooks/useValidatedForm'
import {
  validateRegister,
  type RegisterValues,
} from '../features/auth/validation'

const initialValues: RegisterValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
}

// Same message whether or not the email already exists, to avoid account enumeration.
const CONFIRMATION_MESSAGE =
  'Te hemos enviado un correo para confirmar tu cuenta. Abre el enlace para activarla.'

function getRegisterErrorMessage(error: unknown) {
  return getAuthErrorMessage(
    error,
    'No se ha podido crear la cuenta. Inténtalo de nuevo.',
  )
}

/** Registra una cuenta con contraseña validada y muestra confirmación/reenvío antes de iniciar sesión. */
export default function Register() {
  const { from } = readAuthLocationState(useLocation().state)
  const [isRegistered, setIsRegistered] = useState(false)
  const { values, errors, formError, isSubmitting, setValue, handleSubmit } =
    useValidatedForm({
      initialValues,
      validate: validateRegister,
      onSubmit: async ({ name, email, password }) => {
        const { needsEmailConfirmation } = await signUp({
          name: name.trim(),
          email: email.trim(),
          password,
          redirectPath: from,
        })
        // PublicOnlyRoute redirects if the provider reports a new session.
        if (needsEmailConfirmation) setIsRegistered(true)
      },
      getErrorMessage: getRegisterErrorMessage,
    })

  return (
    <AuthCard title="Registrarse">
      <title>Registrarse | DuoBalance</title>
      {isRegistered ? (
        <>
          <StatusMessage message={CONFIRMATION_MESSAGE} />
          <ResendConfirmation
            initialEmail={values.email.trim()}
            redirectPath={from}
          />
        </>
      ) : (
        <form noValidate onSubmit={handleSubmit}>
          <FormAlert message={formError} />
          <div className="mt-[27px] space-y-3">
            <TextField
              id="name"
              label="Nombre"
              type="text"
              autoComplete="name"
              icon={<UserIcon className="size-[26px]" />}
              value={values.name}
              onChange={(value) => setValue('name', value)}
              error={errors.name}
            />
            <TextField
              id="email"
              label="Correo electrónico"
              type="email"
              autoComplete="email"
              icon={<MailIcon className="size-[26px]" />}
              value={values.email}
              onChange={(value) => setValue('email', value)}
              error={errors.email}
            />
            <TextField
              id="password"
              label="Contraseña"
              type="password"
              autoComplete="new-password"
              icon={<LockIcon className="size-[26px]" />}
              value={values.password}
              onChange={(value) => setValue('password', value)}
              error={errors.password}
              passwordToggle={{
                show: 'Mostrar contraseña',
                hide: 'Ocultar contraseña',
              }}
            />
            <TextField
              id="confirmPassword"
              label="Confirmar contraseña"
              type="password"
              autoComplete="new-password"
              icon={<LockIcon className="size-[26px]" />}
              value={values.confirmPassword}
              onChange={(value) => setValue('confirmPassword', value)}
              error={errors.confirmPassword}
              passwordToggle={{
                show: 'Mostrar confirmación de contraseña',
                hide: 'Ocultar confirmación de contraseña',
              }}
            />
          </div>
          <SubmitButton
            label="Crear cuenta"
            loadingLabel="Creando cuenta…"
            isSubmitting={isSubmitting}
          />
        </form>
      )}
      <p className="mt-[25px] flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[17px] text-navy">
        ¿Ya tienes cuenta?
        <Link
          to="/login"
          state={{ from }}
          className="rounded-sm text-[#1A1FE0] underline underline-offset-2 hover:text-[#11159E]"
        >
          Iniciar sesión
        </Link>
      </p>
    </AuthCard>
  )
}
