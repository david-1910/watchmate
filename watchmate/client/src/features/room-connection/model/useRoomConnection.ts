import { useState, useCallback, useEffect, useRef } from 'react'
import {
  connectSocket,
  disconnectSocket,
  setSocketAuth,
  API_ERROR_CODE,
} from '@/shared/api'
import { useSocketEvent } from '@/shared/lib'
import {
  SOCKET_EVENTS,
  SOCKET_LIFECYCLE,
  SERVER_DISCONNECT_REASON,
} from '@/shared/config'
import {
  session,
  getRoomState,
  type RoomUser,
  type RoomSnapshot,
  type SessionEndReason,
} from '@/entities/room'

// Пауза перед повторным подключением после отказа сервера
const REJECTED_RETRY_DELAY_MS = 5000

type Options = {
  onSessionEnded: (reason: SessionEndReason) => void
}

// Жизненный цикл сокета участника комнаты (CONTRACT.md, разделы 6 и 7).
// Вызывается только при наличии memberToken
export const useRoomConnection = (roomId: string, { onSessionEnded }: Options) => {
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null)
  const [connected, setConnected] = useState(false)
  const [users, setUsers] = useState<RoomUser[]>([])
  const [hostId, setHostId] = useState<string | null>(null)

  const onSessionEndedRef = useRef(onSessionEnded)
  useEffect(() => {
    onSessionEndedRef.current = onSessionEnded
  }, [onSessionEnded])

  // Номер последнего запроса /state — ответ устаревшего переподключения игнорируется
  const stateRequestRef = useRef(0)

  useEffect(() => {
    setSocketAuth(() => ({ roomId, memberToken: session.getMemberToken(roomId) }))
    connectSocket().connect()
    const stateRequests = stateRequestRef
    return () => {
      // Ответ /state, пришедший после отключения, уже не нужен
      stateRequests.current++
      disconnectSocket()
      setSocketAuth(null)
    }
  }, [roomId])

  // На каждый connect, включая переподключения, заново забираем всё состояние комнаты
  const onConnect = useCallback(() => {
    setConnected(true)
    const requestId = ++stateRequestRef.current
    getRoomState(roomId)
      .then((state) => {
        if (requestId !== stateRequestRef.current) return
        setSnapshot(state)
        setUsers(state.users)
        setHostId(state.hostId)
      })
      // UNAUTHORIZED уже сбросил memberToken в memberClient, остальное исправит следующий connect
      .catch(() => {})
  }, [roomId])

  const onDisconnect = useCallback((reason: string) => {
    setConnected(false)
    // После отключения сервером Socket.IO сам не переподключается
    if (reason === SERVER_DISCONNECT_REASON) connectSocket().connect()
  }, [])

  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
  }, [])

  const onConnectError = useCallback(
    (err: Error) => {
      if (err.message === API_ERROR_CODE.UNAUTHORIZED) {
        session.clearMemberToken(roomId)
        return
      }
      // Отказ в middleware сервера (например, RATE_LIMIT) — Socket.IO сам не повторяет
      const socket = connectSocket()
      if (socket.active) return
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
      retryTimerRef.current = setTimeout(() => socket.connect(), REJECTED_RETRY_DELAY_MS)
    },
    [roomId]
  )

  const onSessionEndedEvent = useCallback(
    ({ reason }: { reason: SessionEndReason }) => {
      // Отключаемся сами, чтобы не переподключаться после закрытия сокета сервером
      disconnectSocket()
      onSessionEndedRef.current(reason)
      session.clearMemberToken(roomId)
    },
    [roomId]
  )

  const onUsersUpdate = useCallback((list: RoomUser[]) => setUsers(list), [])
  const onHostUpdate = useCallback((id: string) => setHostId(id), [])

  useSocketEvent(SOCKET_LIFECYCLE.CONNECT, onConnect)
  useSocketEvent<string>(SOCKET_LIFECYCLE.DISCONNECT, onDisconnect)
  useSocketEvent<Error>(SOCKET_LIFECYCLE.CONNECT_ERROR, onConnectError)
  useSocketEvent(SOCKET_EVENTS.SESSION_ENDED, onSessionEndedEvent)
  useSocketEvent(SOCKET_EVENTS.USERS_UPDATE, onUsersUpdate)
  useSocketEvent(SOCKET_EVENTS.HOST_UPDATE, onHostUpdate)

  return {
    snapshot,
    connected,
    users,
    hostId,
    myUserId: snapshot?.me.userId ?? null,
  }
}
