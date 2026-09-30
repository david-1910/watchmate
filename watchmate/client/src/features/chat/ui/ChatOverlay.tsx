import { useEffect, useRef, useState } from 'react'
import type { DisplayMessage } from '@/entities/message'

type Props = {
  messages: DisplayMessage[]
  myUserId: string | null
  className?: string
}

// Сколько сообщение висит поверх видео и сколько видно одновременно
const LIFETIME_MS = 8000
const MAX_VISIBLE = 4

// Новые сообщения чата поверх видео в полноэкранном режиме, как чат на стриме.
// История при открытии не показывается — только то, что пришло, пока оверлей на экране
export const ChatOverlay = ({ messages, myUserId, className = '' }: Props) => {
  const [visible, setVisible] = useState<DisplayMessage[]>([])
  const seenRef = useRef<Set<string> | null>(null)
  const timersRef = useRef(new Set<ReturnType<typeof setTimeout>>())

  useEffect(() => {
    const timers = timersRef.current
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    if (!seenRef.current) {
      seenRef.current = new Set(messages.map((m) => m.clientId))
      return
    }
    const seen = seenRef.current
    const fresh = messages.filter((m) => !seen.has(m.clientId) && m.status !== 'failed')
    if (fresh.length === 0) return
    fresh.forEach((m) => {
      seen.add(m.clientId)
      const timer = setTimeout(() => {
        timersRef.current.delete(timer)
        setVisible((prev) => prev.filter((v) => v.clientId !== m.clientId))
      }, LIFETIME_MS)
      timersRef.current.add(timer)
    })
    setVisible((prev) => [...prev, ...fresh].slice(-MAX_VISIBLE))
  }, [messages])

  if (visible.length === 0) return null

  return (
    <div className={`pointer-events-none flex flex-col items-start gap-1.5 max-w-[min(26rem,calc(100%-2rem))] ${className}`} aria-live="polite">
      {visible.map((m) => (
        <div key={m.clientId} className="px-3 py-1.5 rounded-xl bg-black/65 backdrop-blur-sm text-sm leading-snug break-words"
          style={{ animation: `chat-overlay ${LIFETIME_MS}ms ease forwards` }}>
          <span className={`font-semibold mr-1.5 ${m.userId === myUserId ? 'text-purple-200' : 'text-purple-300'}`}>{m.userName}</span>
          <span className="text-white">{m.message}</span>
        </div>
      ))}
    </div>
  )
}
