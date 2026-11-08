export default function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-ice px-4">
      <p role="status" className="text-[17px] font-medium text-navy">
        {label}
      </p>
    </div>
  )
}
