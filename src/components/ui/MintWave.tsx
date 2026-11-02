export default function MintWave({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 70"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={`pointer-events-none absolute inset-x-0 bottom-0 h-[70px] w-full ${className}`}
    >
      <path
        d="M0 22C120 4 230 40 360 30S540 0 600 6V70H0Z"
        fill="#EEFDF7"
      />
      <path
        d="M0 34C110 18 220 52 350 44S530 16 600 22V70H0Z"
        fill="#DDFCF1"
      />
    </svg>
  )
}
