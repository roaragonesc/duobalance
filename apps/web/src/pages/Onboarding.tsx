import { useCallback } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { ArrowRightIcon, HomeIcon } from '../components/ui/icons'
import FormAlert from '../components/ui/FormAlert'
import SubmitButton from '../components/ui/SubmitButton'
import LoadingScreen from '../components/ui/LoadingScreen'
import RetryPanel from '../components/ui/RetryPanel'
import TextField from '../components/ui/TextField'
import { useAuth } from '../features/auth/hooks/useAuth'
import HouseIllustration from '../features/spaces/components/HouseIllustration'
import OnboardingStep from '../features/spaces/components/OnboardingStep'
import SplitMethodOption from '../features/spaces/components/SplitMethodOption'
import { splitMethods } from '../features/spaces/splitMethods'
import {
  createSpace,
  getCurrentSpaceId,
} from '../features/spaces/services/spaceService'
import { getSpaceErrorMessage } from '../features/spaces/services/spaceErrors'
import {
  validateCreateSpace,
  type CreateSpaceValues,
} from '../features/spaces/validation'
import { useAsyncData } from '../hooks/useAsyncData'
import { useValidatedForm } from '../hooks/useValidatedForm'

const initialValues: CreateSpaceValues = { name: '', splitMethod: 'equal' }

function getCreateSpaceErrorMessage(error: unknown) {
  return getSpaceErrorMessage(
    error,
    'No se ha podido crear el espacio. Inténtalo de nuevo.',
  )
}

/** Comprueba si ya existe un espacio y, si no, presenta su configuración inicial. */
export default function Onboarding() {
  const auth = useAuth()
  const userId = auth.status === 'authenticated' ? auth.session.user.id : ''
  const load = useCallback(() => getCurrentSpaceId(userId), [userId])
  const { state, reload } = useAsyncData(load)

  if (state.status === 'loading') {
    return <LoadingScreen label="Cargando tu espacio…" />
  }
  if (state.status === 'error') {
    return <RetryPanel message="No se ha podido consultar tu espacio. Inténtalo de nuevo." onRetry={reload} />
  }
  // A member already has a space; creating another one would fail.
  if (state.status === 'ready' && state.data) {
    return <Navigate to="/dashboard" replace />
  }
  return <CreateSpaceForm />
}

/** Crea el espacio con nombre y método de reparto validados y continúa al paso de invitación. */
function CreateSpaceForm() {
  const navigate = useNavigate()
  const { values, errors, formError, isSubmitting, setValue, handleSubmit } =
    useValidatedForm({
      initialValues,
      validate: validateCreateSpace,
      onSubmit: async ({ name, splitMethod }) => {
        await createSpace({ name: name.trim(), splitMethod })
        navigate('/onboarding/invite')
      },
      getErrorMessage: getCreateSpaceErrorMessage,
    })

  return (
    <OnboardingStep
      step={1}
      title="Crea tu espacio"
      description="Configura vuestro espacio compartido en unos pasos."
      illustration={<HouseIllustration />}
      formLabel="Datos del espacio"
    >
      <form noValidate onSubmit={handleSubmit}>
        <FormAlert message={formError} />
        <TextField
          id="name"
          label="Nombre del espacio"
          type="text"
          autoComplete="off"
          placeholder="Casa"
          icon={<HomeIcon className="size-[26px]" />}
          value={values.name}
          onChange={(value) => setValue('name', value)}
          error={errors.name}
          showLabel
        />
        <fieldset className="mt-6">
          <legend className="mb-2 text-left text-[18px] font-bold text-navy">
            Método de reparto
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {splitMethods.map((method) => (
              <SplitMethodOption
                key={method.value}
                name="splitMethod"
                {...method}
                checked={values.splitMethod === method.value}
                onChange={() => setValue('splitMethod', method.value)}
              />
            ))}
          </div>
        </fieldset>
        <SubmitButton
          label="Crear espacio"
          loadingLabel="Creando espacio…"
          isSubmitting={isSubmitting}
          icon={<ArrowRightIcon className="size-[24px]" strokeWidth={2.2} />}
          iconPosition="end"
        />
      </form>
    </OnboardingStep>
  )
}
