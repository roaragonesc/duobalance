type FormAlertProps = {
  message: string | null
}

/** Presenta y anuncia el error general del formulario; no renderiza contenido si no hay mensaje. */
export default function FormAlert({ message }: FormAlertProps) {
  if (!message) return null

  return (
    <p
      role="alert"
      className="mt-6 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-left text-[15px] text-red-800"
    >
      {message}
    </p>
  )
}
