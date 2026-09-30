import { useEffect, useRef, useState } from 'react'
import { SendHorizontal } from 'lucide-react'
import { MESSAGE_MAX_LENGTH, type DisplayMessage } from '@/entities/message'

type Props = {
  messages: DisplayMessage[]
  myUserId: string | null
  // Поле ввода: черновик общий с чатом в боковой панели
  draft: string
  onDraftChange: (value: string) => void
  onSend: () => void
  // Поле видно вместе с панелью управления; пока в нём фокус — видно всегда
  showInput: boolean
  onTypingChange: (typing: boolean) => void
  className?: string
}

// Сколько сообщение висит поверх видео и сколько видно одновременно
const LIFETIME_MS = 8000
const MAX_VISIBLE = 4

// Новые сообщения чата поверх видео в полноэкранном режиме, как чат на стриме.
// История при открытии не показывается — только то, что пришло, пока оверлей на экране
export const ChatOverlay = ({ messages, myUserId, draft, onDraftChange, onSend, showInput, onTypingChange, className = '' }: Props) => {
  const [typing, setTyping] = useState(false)
  const setTypingState = (value: boolean) => {
    setTyping(value)
    onTypingChange(value)
  }
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

  const inputVisible = showInput || typing
  if (visible.length === 0 && !inputVisible) return null

  return (
    // Фиксированная ширина колонки: длинные сообщения переносятся, а не тянутся на весь экран
    <div className={`pointer-events-none flex flex-col items-start gap-1.5 w-[min(20rem,calc(100vw-2rem))] ${className}`} aria-live="polite">
      {visible.map((m) => (
        <div key={m.clientId} className="max-w-full px-3 py-1.5 rounded-xl bg-black/65 backdrop-blur-sm text-sm leading-snug break-words"
          style={{ animation: `chat-overlay ${LIFETIME_MS}ms ease forwards` }}>
          <span className={`font-semibold mr-1.5 ${m.userId === myUserId ? 'text-purple-200' : 'text-purple-300'}`}>{m.userName}</span>
          <span className="text-white">{m.message}</span>
        </div>
      ))}
      {inputVisible && (
        <form className="pointer-events-auto w-full flex items-center gap-1.5 mt-1"
          style={{ transform: 'translateY(calc(-1 * var(--keyboard-inset, 0px)))' }}
          onSubmit={(e) => { e.preventDefault(); onSend() }}>
          <input value={draft} onChange={(e) => onDraftChange(e.target.value)} maxLength={MESSAGE_MAX_LENGTH}
            placeholder="Написать в чат…" aria-label="Сообщение в чат"
            onFocus={() => setTypingState(true)} onBlur={() => setTypingState(false)}
            onKeyDown={(e) => { if (e.key === 'Escape') e.currentTarget.blur() }}
            className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-black/70 border border-white/20 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/70" />
          <button type="submit" disabled={!draft.trim()} title="Отправить"
            className="shrink-0 w-9 h-9 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 inline-flex items-center justify-center">
            <SendHorizontal className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  )
}
