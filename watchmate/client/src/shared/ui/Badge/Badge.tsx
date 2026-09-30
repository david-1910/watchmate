type BadgeProps = {
  count: number
  className?: string
}

// Счётчик-бейдж (непрочитанные, новые предложения и т.п.)
function Badge({
  count,
  className = 'min-w-[18px] h-[18px] text-[10px]',
}: BadgeProps) {
  return (
    <span
      className={`px-1 bg-purple-500 text-white font-bold rounded-full flex items-center justify-center leading-none ${className}`}
    >
      {count}
    </span>
  )
}

export { Badge }
