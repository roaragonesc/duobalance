import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowRightIcon, CheckIcon, MailIcon } from '../../../components/ui/icons'

type InvitationLinkProps = {
  url: string
  email: string
}

const buttonClassName =
  'flex h-[54px] w-full items-center justify-center gap-3 rounded-[12px] text-[20px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy motion-reduce:transition-none'

/** Muestra una invitación creada y permite copiarla o compartirla por correo sin enviarla desde el backend. */
export default function InvitationLink({ url, email }: InvitationLinkProps) {
  const [copyStatus, setCopyStatus] = useState('')

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopyStatus('Enlace copiado.')
    } catch {
      setCopyStatus('No se ha podido copiar. Selecciona el enlace y cópialo manualmente.')
    }
  }

  const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
    'Únete a nuestro espacio en DuoBalance',
  )}&body=${encodeURIComponent(`Te invito a nuestro espacio compartido en DuoBalance:\n\n${url}\n\nEl enlace caduca en 7 días.`)}`

  return (
    <div className="text-left">
      <p className="rounded-[12px] border border-[#9FE8D3] bg-[#E6FBF4] px-4 py-3 text-[15px] text-navy">
        Invitación creada para <strong>{email}</strong>. Compártele este enlace:
        caduca en 7 días y solo se puede usar una vez.
      </p>
      <label
        htmlFor="invitation-link"
        className="mt-6 mb-2 block text-[18px] font-bold text-navy"
      >
        Enlace de invitación
      </label>
      <input
        id="invitation-link"
        type="text"
        readOnly
        value={url}
        onFocus={(event) => event.currentTarget.select()}
        className="h-[54px] w-full rounded-[12px] border border-[#C9D6E2] bg-white px-4 text-[16px] text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
      />
      <p role="status" className="mt-2 min-h-6 text-[15px] text-navy">
        {copyStatus}
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={copy}
          className={`${buttonClassName} bg-mint text-navy hover:bg-[#3BCDA9]`}
        >
          <CheckIcon className="size-[24px]" />
          Copiar enlace
        </button>
        <a
          href={mailto}
          className={`${buttonClassName} border-2 border-navy text-navy hover:bg-ice`}
        >
          <MailIcon className="size-[24px]" />
          Enviar por correo
        </a>
      </div>
      <Link
        to="/dashboard"
        className="mt-8 inline-flex items-center gap-3 rounded-sm text-[19px] font-medium text-navy hover:underline"
      >
        Continuar
        <ArrowRightIcon className="size-[22px]" />
      </Link>
    </div>
  )
}