import { useEffect, useState } from 'react'
import FormAlert from '../../../components/ui/FormAlert'
import StatusMessage from '../../../components/ui/StatusMessage'
import SubmitButton from '../../../components/ui/SubmitButton'
import TextField from '../../../components/ui/TextField'
import { MailIcon, SendIcon } from '../../../components/ui/icons'
import { useValidatedForm } from '../../../hooks/useValidatedForm'
import { getAuthErrorMessage } from '../services/authErrors'
import { resendConfirmation } from '../services/authService'
import {
  validateForgotPassword,
  type ForgotPasswordValues,
} from '../validation'

// Prevent repeated resend submissions while the server also enforces rate limits.
export const RESEND_COOLDOWN_SECONDS = 60

// Same message whether or not the account exists, to avoid account enumeration.
const SENT_MESSAGE =
  'Si hay una cuenta pendiente de confirmar con ese correo, te hemos enviado un enlace nuevo.'

type ResendConfirmationProps = {
  initialEmail?: string
  redirectPath?: string
}

function getResendErrorMessage(error: unknown) {
  return getAuthErrorMessage(
    error,
    'No se ha podido reenviar el correo. Inténtalo de nuevo.',
  )
}

/** Formulario de reenvío con validación, mensaje no enumerativo y espera de 60 segundos entre envíos. */
export default function ResendConfirmation({
  initialEmail = '',
  redirectPath,
}: ResendConfirmationProps) {
  const [cooldown, setCooldown] = useState(0)
  const [sent, setSent] = useState(false)
  const { values, errors, formError, isSubmitting, setValue, handleSubmit } =
    useValidatedForm<ForgotPasswordValues>({
      initialValues: { email: initialEmail },
      validate: validateForgotPassword,
      onSubmit: async ({ email }) => {
        if (cooldown > 0) return
        setSent(false)
        await resendConfirmation(email.trim(), redirectPath)
        setSent(true)
        setCooldown(RESEND_COOLDOWN_SECONDS)
      },
      getErrorMessage: getResendErrorMessage,
    })

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setTimeout(() => setCooldown(cooldown - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-labelledby="resend-confirmation-title"
      className="mt-8 text-left"
    >
      <h2
        id="resend-confirmation-title"
        className="text-[19px] font-bold text-navy"
      >
        ¿No te ha llegado o ha caducado?
      </h2>
      <FormAlert message={formError} />
      <StatusMessage message={sent && !formError ? SENT_MESSAGE : null} />
      <div className="mt-5">
        <TextField
          id="resend-email"
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
        label="Reenviar correo de confirmación"
        loadingLabel={
          cooldown > 0
            ? `Podrás reenviarlo en ${cooldown} s`
            : 'Enviando correo…'
        }
        isSubmitting={isSubmitting || cooldown > 0}
        variant="green"
        icon={<SendIcon className="size-[24px]" />}
      />
    </form>
  )
}
