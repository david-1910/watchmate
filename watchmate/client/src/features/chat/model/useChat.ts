import { useState, useRef, useCallback, useEffect } from 'react'
import { connectSocket } from '../../../shared/api'
import { useSocketEvent } from '../../../shared/lib'
import { SOCKET_EVENTS } from '../../../shared/config'
import type { Message } from '../../../shared/types'

export const useChat = (roomId: string | undefined) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const onMessage = useCallback(
    (msg: Message) => setMessages((prev) => [...prev, msg]),
    []
  )

  useSocketEvent<Message>(SOCKET_EVENTS.CHAT_MESSAGE, onMessage, !!roomId)

  const sendMessage = () => {
    if (!draft.trim() || !roomId) return
    connectSocket().emit(SOCKET_EVENTS.CHAT_MESSAGE, { roomId, message: draft })
    setDraft('')
  }

  return { messages, draft, setDraft, sendMessage, messagesEndRef }
}
