import FormAlert from '../../../components/ui/FormAlert'
import StatusMessage from '../../../components/ui/StatusMessage'
import SubmitButton from '../../../components/ui/SubmitButton'
import { useValidatedForm } from '../../../hooks/useValidatedForm'
import { useState } from 'react'
import { getSpaceErrorMessage } from '../services/spaceErrors'
import { splitMethods } from '../splitMethods'
import type { SplitMethod } from '../types/space'
import SplitMethodOption from './SplitMethodOption'

type SplitMethodFormProps = {
  current: SplitMethod
  onSubmit: (method: SplitMethod) => Promise<void>
}

function getErrorMessage(error: unknown) {
  return getSpaceErrorMessage(error, 'No se ha podido cambiar el método de reparto. Inténtalo de nuevo.')
}

/** Cambia el reparto global para gastos nuevos y muestra confirmación o error sin alterar el histórico. */
export default function SplitMethodForm({ current, onSubmit }: SplitMethodFormProps) {
  const [notice, setNotice] = useState<string | null>(null)
  const { values, formError, isSubmitting, setValue, handleSubmit } = useValidatedForm<{
    splitMethod: SplitMethod
  }>({
    initialValues: { splitMethod: current },
    validate: () => ({}),
    onSubmit: async ({ splitMethod }) => {
      setNotice(null)
      await onSubmit(splitMethod)
      setNotice('Método de reparto actualizado.')
    },
    getErrorMessage,
  })

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-5">
      <FormAlert message={formError} />
      <StatusMessage message={notice} className="" />
      <fieldset>
        <legend className="sr-only">Método de reparto</legend>
        <div className="grid gap-4">
          {splitMethods.map((method) => (
            <SplitMethodOption
              key={method.value}
              name="spaceSplitMethod"
              {...method}
              checked={values.splitMethod === method.value}
              onChange={() => setValue('splitMethod', method.value)}
            />
          ))}
        </div>
      </fieldset>
      <p className="text-[15px] text-[#56637F]">
        El cambio se aplicará a los gastos nuevos. Los gastos ya registrados
        conservan su reparto.
      </p>
      {values.splitMethod !== current && (
        <SubmitButton
          label="Guardar método de reparto"
          loadingLabel="Guardando…"
          isSubmitting={isSubmitting}
          variant="green"
        />
      )}
    </form>
  )
}