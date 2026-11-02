import { useState } from 'react'

type DeleteTarget = { id: string; label: string }

// State of a "confirm and delete" flow shared by the list screens.
export function useConfirmDelete<T extends DeleteTarget>(
  remove: (id: string) => Promise<void>,
  getErrorMessage: (error: unknown) => string,
  onDeleted: () => void,
) {
  const [target, setTarget] = useState<T | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  function cancel() {
    setTarget(null)
    setError(null)
  }

  function request(item: T) {
    setNotice(null)
    setTarget(item)
  }

  async function confirm() {
    if (!target || isDeleting) return
    setIsDeleting(true)
    setError(null)
    try {
      await remove(target.id)
      setNotice(`Se ha eliminado «${target.label}».`)
      cancel()
      onDeleted()
    } catch (caught) {
      setError(getErrorMessage(caught))
    } finally {
      setIsDeleting(false)
    }
  }

  return { target, isDeleting, error, notice, request, cancel, confirm }
}
