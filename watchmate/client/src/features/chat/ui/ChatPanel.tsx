import { useRef, useEffect } from 'react'
import {
  MessageBubble,
  MESSAGE_MAX_LENGTH,
  type DisplayMessage,
} from '@/entities/message'

type Props = {
  messages: DisplayMessage[]
  draft: string
  onDraftChange: (v: string) => void
  onSend: () => void
  onRetry: (message: DisplayMessage) => void
  myUserId: string | null
  hostId: string | null
}

const MAX_TEXTAREA_LINES = 8

export const ChatPanel = ({
  messages,
  draft,
  onDraftChange,
  onSend,
  onRetry,
  myUserId,
  hostId,
}: Props) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Авто-высота поля ввода, но не больше MAX_TEXTAREA_LINES строк
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const lineHeight = parseInt(getComputedStyle(el).lineHeight)
    const maxHeight = lineHeight * MAX_TEXTAREA_LINES
    el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px'
  }, [draft])

  return (
    <>
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0 mb-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <svg
              className="w-12 h-12 mx-auto mb-3 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-sm">Пока нет сообщений</p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.clientId}
                message={msg}
                isMe={msg.userId === myUserId}
                isFromHost={!!hostId && msg.userId === hostId}
                isLastInGroup={messages[i + 1]?.userId !== msg.userId}
                animated={i === messages.length - 1}
                onRetry={() => onRetry(msg)}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="relative shrink-0">
        <textarea
          ref={textareaRef}
          placeholder="Сообщение..."
          value={draft}
          rows={1}
          maxLength={MESSAGE_MAX_LENGTH}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSend()
            }
          }}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors resize-none overflow-y-auto no-scrollbar"
        />
        <button
          onClick={() => {
            onSend()
            textareaRef.current?.focus()
          }}
          className="absolute right-2 bottom-2 p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <img src="/send.svg" alt="Send" className="w-5 h-5" />
        </button>
      </div>
    </>
  )
}
