import { useEffect, useState } from 'react'
import { API_ERROR_CODE, isApiError } from '@/shared/api'
import { getRoom } from '../api/roomApi'
import type { RoomInfo } from './types'

export type RoomInfoState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error' }
  | { status: 'ready'; room: RoomInfo }

// Шаг 1 открытия /room/:roomId (CONTRACT.md, раздел 7): GET /rooms/:roomId, 404 → «не найдена»
export const useRoomInfo = (roomId: string): RoomInfoState => {
  const [state, setState] = useState<RoomInfoState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    getRoom(roomId)
      .then((room) => {
        if (!cancelled) setState({ status: 'ready', room })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const notFound = isApiError(err, API_ERROR_CODE.NOT_FOUND)
        setState({ status: notFound ? 'not-found' : 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [roomId])

  return state
}
