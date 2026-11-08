import { useState } from 'react'
import { InfoIcon, MailIcon, SendIcon } from '../components/ui/icons'
import FormAlert from '../components/ui/FormAlert'
import SubmitButton from '../components/ui/SubmitButton'
import TextField from '../components/ui/TextField'
import EnvelopeIllustration from '../features/spaces/components/EnvelopeIllustration'
import InvitationLink from '../features/spaces/components/InvitationLink'
import OnboardingStep from '../features/spaces/components/OnboardingStep'
import { getSpaceErrorMessage } from '../features/spaces/services/spaceErrors'
import { invitePartner } from '../features/spaces/services/spaceService'
import {
  validateInvitePartner,
  type InvitePartnerValues,
} from '../features/spaces/validation'
import { useValidatedForm } from '../hooks/useValidatedForm'

const initialValues: InvitePartnerValues = { email: '' }

function getInviteErrorMessage(error: unknown) {
  return getSpaceErrorMessage(
    error,
    'No se ha podido crear la invitación. Inténtalo de nuevo.',
  )
}

type Invitation = { url: string; email: string }

/** Crea una invitación ligada al correo de la pareja y muestra el enlace para compartirla. */
export default function InvitePartner() {
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const { values, errors, formError, isSubmitting, setValue, handleSubmit } =
    useValidatedForm({
      initialValues,
      validate: validateInvitePartner,
      onSubmit: async ({ email }) => {
        const normalized = email.trim().toLowerCase()
        const url = await invitePartner(normalized)
        setInvitation({ url, email: normalized })
      },
      getErrorMessage: getInviteErrorMessage,
    })

  return (
    <OnboardingStep
      step={2}
      title="Invita a tu pareja"
      description="Crea un enlace de invitación para que se una a vuestro espacio."
      illustration={<EnvelopeIllustration />}
      formLabel="Invitación"
    >
      {invitation ? (
        <InvitationLink url={invitation.url} email={invitation.email} />
      ) : (
        <form noValidate onSubmit={handleSubmit}>
          <FormAlert message={formError} />
          <TextField
            id="email"
            label="Correo electrónico"
            type="email"
            autoComplete="off"
            placeholder="ejemplo@correo.com"
            icon={<MailIcon className="size-[26px]" />}
            value={values.email}
            onChange={(value) => setValue('email', value)}
            error={errors.email}
            describedBy="invite-info"
            showLabel
          />
          <p
            id="invite-info"
            className="mt-6 flex items-center gap-4 rounded-[16px] bg-[#E6FBF4] px-5 py-4 text-left text-[16px] leading-snug text-navy"
          >
            <InfoIcon className="size-[30px] shrink-0 text-[#00A06A]" />
            Te daremos un enlace para que se lo envíes. Solo podrá usarlo tu
            pareja con este correo y caduca en 7 días.
          </p>
          <SubmitButton
            label="Crear invitación"
            loadingLabel="Creando invitación…"
            isSubmitting={isSubmitting}
            icon={<SendIcon className="size-[24px]" strokeWidth={2} />}
          />
        </form>
      )}
    </OnboardingStep>
  )
}