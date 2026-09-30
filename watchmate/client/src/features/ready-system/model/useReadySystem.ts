import { useState, useCallback, useEffect } from 'react'
import { useSocketEvent } from '@/shared/lib'
import { SOCKET_EVENTS } from '@/shared/config'
import {
  toggleReady as toggleReadyRequest,
  startWatching as startWatchingRequest,
  type ReadyState,
  type RoomSnapshot,
} from '@/entities/room'

const EMPTY_READY: ReadyState = { readyUsers: [], allReady: false }

// Зрители отмечают готовность, хост готов по умолчанию и запускает отсчёт (CONTRACT.md, Ready)
export const useReadySystem = (roomId: string, snapshot: RoomSnapshot | null) => {
  const [ready, setReady] = useState<ReadyState>(EMPTY_READY)

  useEffect(() => {
    if (snapshot) setReady(snapshot.ready)
  }, [snapshot])

  const onReadyUpdate = useCallback((data: ReadyState) => setReady(data), [])
  useSocketEvent(SOCKET_EVENTS.READY_UPDATE, onReadyUpdate)

  const toggleReady = () => {
    toggleReadyRequest(roomId).then(setReady).catch(() => {})
  }

  // Результат придёт событиями countdown и ready-update
  const startWatching = () => {
    startWatchingRequest(roomId).catch(() => {})
  }

  return { readyUsers: ready.readyUsers, allReady: ready.allReady, toggleReady, startWatching }
}
