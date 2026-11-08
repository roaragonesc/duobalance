import type { ReactNode } from 'react'
import Logo from '../../../components/ui/Logo'
import MintWave from '../../../components/ui/MintWave'

type AuthLightCardProps = {
  title: string
  description: string
  children: ReactNode
}

/** Tarjeta clara de confirmación/recuperación con marca, título, descripción y contenido. */
export default function AuthLightCard({
  title,
  description,
  children,
}: AuthLightCardProps) {
  return (
    <section
      aria-labelledby="auth-card-title"
      className="relative w-full max-w-[560px] overflow-hidden rounded-[24px] bg-white px-6 pt-5 pb-[76px] text-center shadow-[0_10px_40px_rgba(11,32,56,0.08)] sm:px-[44px]"
    >
      <Logo tone="onLight" />
      <h1
        id="auth-card-title"
        className="mt-6 text-[30px] leading-tight font-extrabold text-navy sm:text-[34px]"
      >
        {title}
      </h1>
      <p className="mx-auto mt-3 max-w-[440px] text-[17px] leading-[1.55] text-[#56637F]">
        {description}
      </p>
      {children}
      <MintWave />
    </section>
  )
}
