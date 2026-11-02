type RetryPanelProps = {
  message: string
  onRetry: () => void
  className?: string
}

export default function RetryPanel({
  message,
  onRetry,
  className = '',
}: RetryPanelProps) {
  return (
    <div
      className={`rounded-[20px] border border-red-200 bg-white p-6 text-center ${className}`}
    >
      <p role="alert" className="text-[16px] text-red-800">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-[12px] bg-navy px-5 py-2.5 text-[16px] font-semibold text-white hover:bg-[#13304F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
      >
        Reintentar
      </button>
    </div>
  )
}
