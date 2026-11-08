import type { ReactNode } from 'react'

type AuthCardProps = {
  title: string
  children?: ReactNode
}

/** Tarjeta de autenticación con título principal asociado y contenido aportado por la página. */
export default function AuthCard({
  title,
  children,
}: AuthCardProps) {
  return (
    <section
      aria-labelledby="auth-card-title"
      className="w-full max-w-[500px] rounded-[24px] bg-white px-6 pt-7 pb-[30px] shadow-[0_24px_60px_rgba(0,0,0,0.3)] sm:px-[34px]"
    >
      <h1
        id="auth-card-title"
        className="text-center text-[30px] leading-tight font-extrabold text-navy sm:text-[34px]"
      >
        {title}
      </h1>
      {children}
    </section>
  )
}
