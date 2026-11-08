import { Link, useLocation } from 'react-router'
import AuthCard from '../features/auth/components/AuthCard'
import FormAlert from '../components/ui/FormAlert'
import StatusMessage from '../components/ui/StatusMessage'
import TextField from '../components/ui/TextField'
import { LockIcon, MailIcon } from '../components/ui/icons'
import SubmitButton from '../components/ui/SubmitButton'
import { getAuthErrorMessage } from '../features/auth/services/authErrors'
import { signIn } from '../features/auth/services/authService'
import { readAuthLocationState } from '../features/auth/navigation'
import { useValidatedForm } from '../hooks/useValidatedForm'
import { validateLogin, type LoginValues } from '../features/auth/validation'

const initialValues: LoginValues = { email: '', password: '' }

const linkClassName =
  'rounded-sm text-[#1A1FE0] underline underline-offset-2 hover:text-[#11159E]'

function getLoginErrorMessage(error: unknown) {
  return getAuthErrorMessage(
    error,
    'No se ha podido iniciar sesión. Inténtalo de nuevo.',
  )
}

/** Formulario de acceso que valida credenciales y conserva avisos y destino previo a la autenticación. */
export default function Login() {
  const { notice, from } = readAuthLocationState(useLocation().state)
  // PublicOnlyRoute redirects once the provider reports the new session.
  const { values, errors, formError, isSubmitting, setValue, handleSubmit } =
    useValidatedForm({
      initialValues,
      validate: validateLogin,
      onSubmit: ({ email, password }) =>
        signIn({ email: email.trim(), password }),
      getErrorMessage: getLoginErrorMessage,
    })

  return (
    <AuthCard title="Login">
      <title>Login | DuoBalance</title>
      <StatusMessage message={formError ? null : (notice ?? null)} />
      <form noValidate onSubmit={handleSubmit}>
        <FormAlert message={formError} />
        <div className="mt-[30px] space-y-[18px]">
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
            autoComplete="current-password"
            icon={<LockIcon className="size-[26px]" />}
            value={values.password}
            onChange={(value) => setValue('password', value)}
            error={errors.password}
            passwordToggle={{
              show: 'Mostrar contraseña',
              hide: 'Ocultar contraseña',
            }}
          />
        </div>
        <SubmitButton
          label="Iniciar sesión"
          loadingLabel="Iniciando sesión…"
          isSubmitting={isSubmitting}
        />
      </form>
      <p className="mt-[30px] flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[19px] text-navy">
        <Link to="/register" state={{ from }} className={linkClassName}>
          Registrarse
        </Link>
        <span aria-hidden="true">|</span>
        <Link to="/forgot-password" className={linkClassName}>
          Recuperar contraseña
        </Link>
      </p>
    </AuthCard>
  )
}
