import { type RefObject, useRef, useEffect } from 'react'
import type { Message } from '../../../shared/types'

type Props = {
  messages: Message[]
  draft: string
  onDraftChange: (v: string) => void
  onSend: () => void
  messagesEndRef: RefObject<HTMLDivElement | null>
  currentUserName: string
  hostUserName?: string
}

export const ChatPanel = ({ messages, draft, onDraftChange, onSend, messagesEndRef, currentUserName, hostUserName }: Props) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const lineHeight = parseInt(getComputedStyle(el).lineHeight)
    const maxHeight = lineHeight * 8
    el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px'
  }, [draft])

  return (
  <>
    <div className="flex-1 overflow-y-auto space-y-2 min-h-0 mb-3">
      {messages.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-sm">Пока нет сообщений</p>
        </div>
      ) : (
        <>
          {messages.map((msg, i) => {
            const isMe = msg.userName === currentUserName
            const isHost = !!hostUserName && msg.userName === hostUserName
            const isLastOverall = i === messages.length - 1
            const isLastInGroup = messages[i + 1]?.userName !== msg.userName
            return (
              <div key={i} className={`flex ${isLastOverall ? 'animate-message-in' : ''} ${isMe ? 'justify-end pr-2' : 'justify-start pl-2'}`}>
                <div className="max-w-[80%] relative">
                  <div className={`px-3 py-1.5 pb-4 rounded-2xl relative ${isMe ? 'bg-purple-500 text-white' : 'bg-slate-700 text-gray-200'} ${isLastInGroup ? (isMe ? 'rounded-br-none' : 'rounded-bl-none') : ''}`}>
                    {!isMe && (
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-xs text-purple-400 font-medium">{msg.userName}</span>
                        {isHost && <span className="text-xs select-none">👑</span>}
                      </div>
                    )}
                    <p className="text-sm break-words">{msg.message}</p>
                    <span className={`absolute bottom-1 right-2 text-[10px] ${isMe ? 'text-purple-200' : 'text-gray-500'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {isLastInGroup && (
                    <div className={`absolute bottom-0 w-2 h-2 ${isMe ? 'right-0 translate-x-full bg-purple-500' : 'left-0 -translate-x-full bg-slate-700'}`}
                      style={{ clipPath: isMe ? 'polygon(0 0, 0 100%, 100% 100%)' : 'polygon(100% 0, 0 100%, 100% 100%)' }} />
                  )}
                </div>
              </div>
            )
          })}
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
        onChange={(e) => onDraftChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() } }}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors resize-none overflow-y-auto no-scrollbar"
      />
      <button onClick={() => { onSend(); textareaRef.current?.focus() }} className="absolute right-2 bottom-2 p-2 hover:bg-white/10 rounded-lg transition-colors">
        <img src="/send.svg" alt="Send" className="w-5 h-5" />
      </button>
    </div>
  </>
  )
}
