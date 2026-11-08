type StatusMessageProps = {
  message: string | null
  className?: string
}

export default function StatusMessage({
  message,
  className = 'mt-6',
}: StatusMessageProps) {
  if (!message) return null

  return (
    <p
      role="status"
      className={`rounded-[12px] border border-[#9FE8D3] bg-[#E6FBF4] px-4 py-3 text-left text-[15px] text-navy ${className}`}
    >
      {message}
    </p>
  )
}
