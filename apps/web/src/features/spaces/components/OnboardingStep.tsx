import type { ReactNode } from 'react'
import OnboardingStepper from './OnboardingStepper'

type OnboardingStepProps = {
  step: 1 | 2 | 3
  title: string
  description: string
  illustration: ReactNode
  formLabel: string
  children: ReactNode
}

/** Compone un paso de configuración con progreso, ilustración, explicación y contenido del formulario. */
export default function OnboardingStep({
  step,
  title,
  description,
  illustration,
  formLabel,
  children,
}: OnboardingStepProps) {
  return (
    <>
      <title>{`${title} | DuoBalance`}</title>
      <OnboardingStepper currentStep={step} />
      <div className="mt-8 grid items-center gap-8 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_640px] lg:gap-10">
        <div className="flex flex-col items-center text-center">
          {illustration}
          <h1 className="mt-4 text-[30px] leading-tight font-extrabold text-navy sm:text-[34px]">
            {title}
          </h1>
          <p className="mt-3 max-w-[340px] text-[17px] leading-[1.55] text-[#56637F]">
            {description}
          </p>
        </div>
        <section
          aria-label={formLabel}
          className="rounded-[24px] border border-[#EEF0F3] bg-white p-6 shadow-[0_10px_40px_rgba(11,32,56,0.06)] sm:p-9"
        >
          {children}
        </section>
      </div>
    </>
  )
}
