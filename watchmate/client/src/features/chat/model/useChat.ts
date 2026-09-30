import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { generateUuid, useSocketEvent } from '@/shared/lib'
import { SOCKET_EVENTS } from '@/shared/config'
import { memberClient, type RoomSnapshot } from '@/entities/room'
import {
  fetchMessages,
  postMessage,
  MESSAGE_MAX_LENGTH,
  type ChatMessage,
  type DisplayMessage,
  type MessageStatus,
} from '@/entities/message'
import { mergeMessages } from '../lib/mergeMessages'
import { sendWithRetry } from '../lib/sendWithRetry'
import { MESSAGE_RETRY_DELAYS_MS } from '../config/retry'

type ChatAuthor = { userId: string; userName: string }

// Лента чата по CONTRACT.md, раздел 7: догрузка по afterSeq на каждый connect
// (новый snapshot), оптимистичная отправка и дедупликация по clientId
export const useChat = (
  roomId: string,
  snapshot: RoomSnapshot | null,
  author: ChatAuthor | null
) => {
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [draft, setDraft] = useState('')
  // Курсор догрузки: все сообщения с seq <= lastSeq уже получены.
  // Двигается только без пропусков, иначе afterSeq перескочил бы через потерянные сообщения
  const lastSeqRef = useRef(0)
  const seenSeqsRef = useRef(new Set<number>())
  const timersRef = useRef(new Set<ReturnType<typeof setTimeout>>())
  const client = useMemo(() => memberClient(roomId), [roomId])

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach(clearTimeout)
      timers.clear()
    }
  }, [])

  const advanceCursor = useCallback((atLeast: number) => {
    const seen = seenSeqsRef.current
    let cursor = Math.max(lastSeqRef.current, atLeast)
    while (seen.has(cursor + 1)) cursor++
    seen.forEach((seq) => { if (seq <= cursor) seen.delete(seq) })
    lastSeqRef.current = cursor
  }, [])

  const applyServerMessages = useCallback((incoming: ChatMessage[]) => {
    if (incoming.length === 0) return
    incoming.forEach((m) => seenSeqsRef.current.add(m.seq))
    advanceCursor(0)
    setMessages((prev) => mergeMessages(prev, incoming))
  }, [advanceCursor])

  useEffect(() => {
    if (!snapshot) return
    let cancelled = false
    fetchMessages(client, lastSeqRef.current)
      .then((page) => {
        if (cancelled) return
        applyServerMessages(page.messages)
        // Ответ afterSeq полный: всё до page.lastSeq теперь получено
        advanceCursor(page.lastSeq)
      })
      // Пропущенные сообщения догрузятся при следующем connect
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [snapshot, client, applyServerMessages, advanceCursor])

  const onMessageNew = useCallback(
    (msg: ChatMessage) => applyServerMessages([msg]),
    [applyServerMessages]
  )
  useSocketEvent(SOCKET_EVENTS.MESSAGE_NEW, onMessageNew)

  const setStatus = useCallback((clientId: string, status: MessageStatus) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.clientId === clientId && m.status !== 'sent' ? { ...m, status } : m
      )
    )
  }, [])

  // Паузы между повторами снимаются при размонтировании
  const wait = useCallback(
    (ms: number) =>
      new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          timersRef.current.delete(timer)
          resolve()
        }, ms)
        timersRef.current.add(timer)
      }),
    []
  )

  const deliver = useCallback(
    (clientId: string, text: string) => {
      sendWithRetry(
        () => postMessage(client, { clientId, message: text }),
        MESSAGE_RETRY_DELAYS_MS,
        wait
      )
        .then((msg) => applyServerMessages([msg]))
        .catch(() => setStatus(clientId, 'failed'))
    },
    [client, wait, applyServerMessages, setStatus]
  )

  const sendMessage = () => {
    const text = draft.trim()
    if (!text || text.length > MESSAGE_MAX_LENGTH || !author) return
    const clientId = generateUuid()
    setMessages((prev) => [
      ...prev,
      {
        id: null,
        seq: null,
        clientId,
        userId: author.userId,
        userName: author.userName,
        message: text,
        timestamp: new Date().toISOString(),
        status: 'pending',
      },
    ])
    setDraft('')
    deliver(clientId, text)
  }

  const retryMessage = (message: DisplayMessage) => {
    setStatus(message.clientId, 'pending')
    deliver(message.clientId, message.message)
  }

  return { messages, draft, setDraft, sendMessage, retryMessage }
}
