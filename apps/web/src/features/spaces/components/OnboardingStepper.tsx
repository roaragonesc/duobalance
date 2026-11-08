import { Link } from 'react-router'
import { CheckIcon } from '../../../components/ui/icons'

const steps = [
  { label: 'Crear espacio', path: '/onboarding' },
  { label: 'Invitar pareja', path: '/onboarding/invite' },
  { label: 'Listo', path: null },
] as const

type OnboardingStepperProps = {
  currentStep: 1 | 2 | 3
}

export default function OnboardingStepper({
  currentStep,
}: OnboardingStepperProps) {
  return (
    <ol
      aria-label="Pasos de configuración"
      className="mx-auto mt-4 grid w-full max-w-[680px] grid-cols-3"
    >
      {steps.map(({ label, path }, index) => {
        const step = index + 1
        const isCurrent = step === currentStep
        const isDone = step < currentStep
        const content = (
          <>
            <span
              aria-hidden="true"
              className={`flex size-[48px] items-center justify-center rounded-full text-[22px] font-bold ${
                isCurrent
                  ? 'bg-[#00A06A] text-white'
                  : isDone
                    ? 'bg-[#D9F8EC] text-[#00A06A]'
                    : 'bg-[#EAE8E7] text-[#5B647C]'
              }`}
            >
              {isDone ? (
                <CheckIcon className="size-[24px]" strokeWidth={3} />
              ) : (
                step
              )}
            </span>
            <span
              className={`mt-2 text-[15px] sm:text-[18px] ${
                isCurrent ? 'font-semibold text-navy' : 'text-[#5B647C]'
              }`}
            >
              <span className="sr-only">
                Paso {step}
                {isDone ? ' (completado)' : ''}:{' '}
              </span>
              {label}
            </span>
          </>
        )

        return (
          <li
            key={label}
            aria-current={isCurrent ? 'step' : undefined}
            className="relative flex flex-col items-center text-center"
          >
            {index > 0 && (
              <span
                aria-hidden="true"
                className={`absolute top-[23px] right-[calc(50%+32px)] left-[calc(-50%+32px)] h-[3px] rounded-full ${
                  step <= currentStep ? 'bg-mint' : 'bg-[#D8DDE5]'
                }`}
              />
            )}
            {isDone && path ? (
              <Link
                to={path}
                className="flex flex-col items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy"
              >
                {content}
              </Link>
            ) : (
              content
            )}
          </li>
        )
      })}
    </ol>
  )
}
