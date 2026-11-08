import { useState } from 'react'
import MonthPageHeader from '../components/layout/MonthPageHeader'
import FormAlert from '../components/ui/FormAlert'
import { controlClassName, fieldLabelClassName } from '../components/ui/FormControls'
import StatusMessage from '../components/ui/StatusMessage'
import SubmitButton from '../components/ui/SubmitButton'
import TextField from '../components/ui/TextField'
import { UserIcon } from '../components/ui/icons'
import { panelClassName } from '../components/ui/panel'
import SignOutButton from '../features/auth/components/SignOutButton'
import { useAuth } from '../features/auth/hooks/useAuth'
import { updateDisplayName, validateDisplayName } from '../features/auth/services/profileService'
import { getInitials } from '../lib/initials'
import { useActiveWorkspace } from '../features/spaces/workspaceContext'
import { collectErrors, useValidatedForm } from '../hooks/useValidatedForm'

export default function Profile() {
  const { displayName, setDisplayName } = useActiveWorkspace()
  const auth = useAuth()
  const user = auth.status === 'authenticated' ? auth.session.user : null
  const email = user?.email ?? ''
  const [notice, setNotice] = useState<string | null>(null)

  const { values, errors, formError, isSubmitting, setValue, handleSubmit } = useValidatedForm({
    initialValues: { name: displayName },
    validate: (formValues) => collectErrors({ name: validateDisplayName(formValues.name) }),
    onSubmit: async ({ name }) => {
      setNotice(null)
      if (!user) throw new Error('Not authenticated')
      setDisplayName(await updateDisplayName(user.id, name))
      setNotice('Nombre actualizado.')
    },
    getErrorMessage: () => 'No se ha podido actualizar el nombre. Inténtalo de nuevo.',
  })

  return (
    <div className="mx-auto max-w-[980px] space-y-6">
      <MonthPageHeader
        title="Mi perfil"
        description="Consulta y gestiona tu información de usuario."
        showMonth={false}
      />

      <section aria-labelledby="profile-name" className={`flex items-center gap-6 p-6 ${panelClassName}`}>
        <span
          aria-hidden="true"
          className="flex size-24 shrink-0 items-center justify-center rounded-full bg-[#E3F8F1] text-[32px] font-bold text-[#007A4D]"
        >
          {getInitials(displayName)}
        </span>
        <div className="min-w-0">
          <h2 id="profile-name" className="text-[28px] font-bold break-words text-navy">
            {displayName}
          </h2>
          <p className="text-[18px] break-all text-[#56637F]">{email}</p>
        </div>
      </section>

      <section aria-labelledby="account-title" className={`p-6 sm:p-8 ${panelClassName}`}>
        <h2 id="account-title" className="mb-6 text-[22px] font-bold text-navy">
          Información de la cuenta
        </h2>
        <form noValidate onSubmit={handleSubmit} className="space-y-6">
          <FormAlert message={formError} />
          <StatusMessage message={notice} className="" />
          <TextField
            id="name"
            label="Nombre"
            type="text"
            autoComplete="name"
            icon={<UserIcon className="size-6" />}
            value={values.name}
            onChange={(value) => setValue('name', value)}
            error={errors.name}
            showLabel
          />
          <div>
            <label htmlFor="email" className={fieldLabelClassName}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              readOnly
              aria-describedby="email-note"
              className={`${controlClassName} border-[#D5DCE4] bg-[#F1F5F8]! text-[#3E4C63]`}
            />
            <p id="email-note" className="mt-1.5 text-[15px] text-[#56637F]">
              El email no se puede modificar.
            </p>
          </div>
          <SubmitButton
            label="Guardar nombre"
            loadingLabel="Guardando…"
            isSubmitting={isSubmitting}
            variant="green"
          />
        </form>
      </section>

      <SignOutButton variant="danger" className="text-red-700" />
    </div>
  )
}