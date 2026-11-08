import { LogoutIcon } from '../../../components/ui/icons'
import { useSignOut } from '../hooks/useSignOut'

type SignOutButtonProps = {
  className?: string
  /** "danger" is the outlined red button of the profile screen. */
  variant?: 'link' | 'danger'
}

const variants = {
  link: 'rounded-[10px] px-3 py-2 text-[15px] font-semibold underline-offset-2 hover:underline focus-visible:outline-current',
  danger:
    'flex h-[56px] w-full items-center justify-center gap-3 rounded-[14px] border-2 border-red-600 bg-white px-8 text-[18px] font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-navy sm:w-auto sm:min-w-[300px]',
}

/** Cierra la sesión con bloqueo de envíos repetidos y error visible; admite variante de perfil. */
export default function SignOutButton({ className = '', variant = 'link' }: SignOutButtonProps) {
  const { signOut, isSigningOut, error } = useSignOut()

  return (
    <div className={className}>
      <button
        type="button"
        onClick={signOut}
        disabled={isSigningOut}
        className={`focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-70 ${variants[variant]}`}
      >
        {variant === 'danger' && <LogoutIcon className="size-6" />}
        {isSigningOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-[14px]">
          {error}
        </p>
      )}
    </div>
  )
}