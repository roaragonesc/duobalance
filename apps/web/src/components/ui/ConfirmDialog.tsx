import { useEffect, useId, useRef } from 'react'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  pendingLabel: string
  isPending: boolean
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
}

/** Confirma acciones destructivas en un diálogo modal con foco nativo, cancelación y estado pendiente/error. */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pendingLabel,
  isPending,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault()
        if (!isPending) onCancel()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-[20px] bg-white p-6 text-navy shadow-xl backdrop:bg-navy/40"
    >
      {open && (
        <>
          <h2 id={titleId} className="text-[21px] font-bold">
            {title}
          </h2>
          <p id={descriptionId} className="mt-2 text-[16px] text-[#3E4C63]">
            {description}
          </p>
          {error && (
            <p role="alert" className="mt-4 text-[15px] text-red-700">
              {error}
            </p>
          )}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              autoFocus
              onClick={onCancel}
              disabled={isPending}
              className="rounded-[12px] border border-[#D5DCE4] px-5 py-2.5 text-[16px] font-semibold hover:bg-ice focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className="rounded-[12px] bg-red-700 px-5 py-2.5 text-[16px] font-semibold text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:opacity-60"
            >
              {isPending ? pendingLabel : confirmLabel}
            </button>
          </div>
        </>
      )}
    </dialog>
  )
}
