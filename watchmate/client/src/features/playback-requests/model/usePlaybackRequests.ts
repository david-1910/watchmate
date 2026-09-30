import { useState, useCallback, useEffect, useRef } from 'react'
import { connectSocket } from '@/shared/api'
import { useSocketEvent } from '@/shared/lib'
import { SOCKET_EVENTS } from '@/shared/config'
import type { MyRequest, PlaybackRequest, RequestAnswer, RequestType } from './types'

// Сколько показывать ответ хоста и сколько ждать его, прежде чем снять «ждём ответа»
const ANSWER_VISIBLE_MS = 4000
const ANSWER_TIMEOUT_MS = 30000

export const usePlaybackRequests = (isHost: boolean) => {
  // Хост: входящие запросы зрителей
  const [requests, setRequests] = useState<PlaybackRequest[]>([])
  // Зритель: статус своего последнего запроса
  const [myRequest, setMyRequest] = useState<MyRequest | null>(null)
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearMyRequestIn = useCallback((ms: number) => {
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
    clearTimerRef.current = setTimeout(() => setMyRequest(null), ms)
  }, [])

  useEffect(() => () => {
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
  }, [])

  const onRequestNotify = useCallback((req: PlaybackRequest) => {
    setRequests((prev) => [...prev, req])
  }, [])
  useSocketEvent(SOCKET_EVENTS.PLAYBACK_REQUEST_NOTIFY, onRequestNotify, isHost)

  const onRequestAnswered = useCallback((answer: RequestAnswer) => {
    setMyRequest({ status: 'answered', type: answer.type, accepted: answer.accepted })
    clearMyRequestIn(ANSWER_VISIBLE_MS)
  }, [clearMyRequestIn])
  useSocketEvent(SOCKET_EVENTS.PLAYBACK_REQUEST_ANSWERED, onRequestAnswered, !isHost)

  const sendRequest = useCallback((type: RequestType, videoUrl?: string) => {
    connectSocket().emit(SOCKET_EVENTS.PLAYBACK_REQUEST, { type, videoUrl })
    setMyRequest({ status: 'pending', type })
    clearMyRequestIn(ANSWER_TIMEOUT_MS)
  }, [clearMyRequestIn])

  // Хост ответил: запрос уходит из списка, отправитель узнаёт решение
  const answerRequest = useCallback((id: string, accepted: boolean) => {
    connectSocket().emit(SOCKET_EVENTS.PLAYBACK_REQUEST_ANSWER, { requestId: id, accepted })
    setRequests((prev) => prev.filter((r) => r.id !== id))
  }, [])

  return { requests, answerRequest, myRequest, sendRequest }
}
