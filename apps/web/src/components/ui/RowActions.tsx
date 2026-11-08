import { Link } from 'react-router'
import { PencilIcon, TrashIcon } from './icons'

type RowActionsProps = {
  /** Accessible name of the row, e.g. the concept. */
  label: string
  editTo: string
  onDelete: () => void
  canEdit: boolean
  readOnlyNote: string
}

// Edit link and delete button of a table row; hidden when the user cannot
// modify the row (the database enforces it too).
export default function RowActions({
  label,
  editTo,
  onDelete,
  canEdit,
  readOnlyNote,
}: RowActionsProps) {
  if (!canEdit) {
    return <span className="relative"><span className="sr-only">{readOnlyNote}</span></span>
  }
  return (
    <div className="flex justify-end gap-1">
      <Link
        to={editTo}
        aria-label={`Editar ${label}`}
        className="flex size-10 items-center justify-center rounded-[10px] text-navy hover:bg-ice focus-visible:outline-2 focus-visible:outline-navy"
      >
        <PencilIcon className="size-5" />
      </Link>
      <button
        type="button"
        aria-label={`Eliminar ${label}`}
        onClick={onDelete}
        className="flex size-10 items-center justify-center rounded-[10px] text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-navy"
      >
        <TrashIcon className="size-5" />
      </button>
    </div>
  )
}
