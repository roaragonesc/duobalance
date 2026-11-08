import darkLogo from '../../assets/duobalance-logo.png'
import lightLogo from '../../assets/duobalance-logo-light.png'

type LogoProps = {
  tone: 'onDark' | 'onLight'
  className?: string
}

/** Muestra la marca con la variante adecuada al fondo y texto alternativo DuoBalance. */
export default function Logo({ tone, className = '' }: LogoProps) {
  return (
    <img
      src={tone === 'onDark' ? darkLogo : lightLogo}
      alt="DuoBalance"
      width={340}
      height={152}
      className={`mx-auto h-auto w-[200px] max-w-[60vw] ${className}`}
    />
  )
}
