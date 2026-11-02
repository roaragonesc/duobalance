const RING_RADIUS = 140
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function arc(degrees: number) {
  return `${(degrees / 360) * CIRCUMFERENCE} ${CIRCUMFERENCE}`
}

export default function AuthBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[radial-gradient(ellipse_at_center,rgba(20,80,140,0.22),transparent_70%)]"
    >
      <svg
        viewBox="-180 -180 360 360"
        className="absolute -top-[180px] -right-[180px] size-[360px] max-sm:hidden"
      >
        <circle
          r="116"
          fill="none"
          stroke="#1E6EAA"
          strokeOpacity="0.16"
          strokeWidth="60"
        />
      </svg>
      <svg
        viewBox="-180 -180 360 360"
        className="absolute -bottom-[145px] -left-[159px] size-[360px] max-sm:hidden"
      >
        <circle
          r={RING_RADIUS}
          fill="none"
          stroke="#1E6EAA"
          strokeOpacity="0.16"
          strokeWidth="73"
          strokeDasharray={arc(258)}
          transform="rotate(282)"
        />
        <circle
          r={RING_RADIUS}
          fill="none"
          stroke="#47DDB9"
          strokeOpacity="0.1"
          strokeWidth="73"
          strokeDasharray={arc(90)}
          transform="rotate(184)"
        />
      </svg>
    </div>
  )
}
