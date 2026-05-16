import { useState, useCallback } from 'react'
import { connectSocket } from '../../../shared/api'
import { useSocketEvent } from '../../../shared/lib'
import { SOCKET_EVENTS } from '../../../shared/config'
import type { ReadyUpdate } from '../../../shared/types'

export const useReadySystem = (roomId: string | undefined) => {
  const [readyUsers, setReadyUsers] = useState<string[]>([])

  const onReadyUpdate = useCallback((data: ReadyUpdate) => setReadyUsers(data.readyUsers), [])
  useSocketEvent<ReadyUpdate>(SOCKET_EVENTS.READY_UPDATE, onReadyUpdate, !!roomId)

  const toggleReady = () => {
    if (!roomId) return
    connectSocket().emit(SOCKET_EVENTS.TOGGLE_READY, roomId)
  }

  return { readyUsers, toggleReady }
}
