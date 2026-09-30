import { useEffect, useRef, useState, type ReactNode } from 'react'
import { copyToClipboard } from '../../lib'

type CopyButtonProps = {
  text: string
  children: ReactNode
  title?: string
  className?: string
}

const COPIED_RESET_MS = 2000

function CopyButton({ text, children, title, className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const copy = async () => {
    if (!(await copyToClipboard(text))) return
    setCopied(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopied(false), COPIED_RESET_MS)
  }

  return (
    <button
      onClick={copy}
      title={title}
      className={`flex items-center gap-1.5 glass px-2 md:px-3 py-1.5 md:py-2 rounded-xl hover:bg-white/10 transition-all group ${className}`}
    >
      {children}
      {copied ? (
        <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 group-hover:text-purple-300 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  )
}

export { CopyButton }
