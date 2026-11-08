import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeftIcon, MailIcon, SendIcon } from '../components/ui/icons'
import FormAlert from '../components/ui/FormAlert'
import StatusMessage from '../components/ui/StatusMessage'
import AuthLightCard from '../features/auth/components/AuthLightCard'
import TextField from '../components/ui/TextField'
import SubmitButton from '../components/ui/SubmitButton'
import { getAuthErrorMessage } from '../features/auth/services/authErrors'
import { requestPasswordReset } from '../features/auth/services/authService'
import {
  validateForgotPassword,
  type ForgotPasswordValues,
} from '../features/auth/validation'
import { useValidatedForm } from '../hooks/useValidatedForm'

const initialValues: ForgotPasswordValues = { email: '' }

// Neutral wording: never reveals whether the email is registered.
const SENT_MESSAGE =
  'Si existe una cuenta con ese correo, recibirás un enlace para establecer una nueva contraseña. Revisa también la carpeta de spam.'

function getForgotPasswordErrorMessage(error: unknown) {
  return getAuthErrorMessage(
    error,
    'No se ha podido enviar el enlace. Inténtalo de nuevo.',
  )
}

export default function ForgotPassword() {
  const [isSent, setIsSent] = useState(false)
  const { values, errors, formError, isSubmitting, setValue, handleSubmit } =
    useValidatedForm({
      initialValues,
      validate: validateForgotPassword,
      onSubmit: async ({ email }) => {
        await requestPasswordReset(email.trim())
        setIsSent(true)
      },
      getErrorMessage: getForgotPasswordErrorMessage,
    })

  return (
    <AuthLightCard
      title="¿Has olvidado tu contraseña?"
      description="Te enviaremos un enlace a tu correo para que puedas establecer una nueva contraseña."
    >
      <title>Recuperar contraseña | DuoBalance</title>
      {isSent ? (
        <StatusMessage message={SENT_MESSAGE} className="mt-10" />
      ) : (
        <form noValidate onSubmit={handleSubmit}>
          <FormAlert message={formError} />
          <div className="mt-10">
            <TextField
              id="email"
              label="Correo electrónico"
              type="email"
              autoComplete="email"
              icon={<MailIcon className="size-[26px]" />}
              value={values.email}
              onChange={(value) => setValue('email', value)}
              error={errors.email}
              showLabel
            />
          </div>
          <SubmitButton
            label="Enviar enlace"
            loadingLabel="Enviando enlace…"
            isSubmitting={isSubmitting}
            variant="green"
            icon={<SendIcon className="size-[24px]" />}
          />
        </form>
      )}
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
