import { useState, useCallback } from 'react'
import { connectSocket } from '@/shared/api'
import { useSocketEvent } from '@/shared/lib'
import { SOCKET_EVENTS } from '@/shared/config'
import type { PlaybackRequest, RequestType } from './types'

export const usePlaybackRequests = (isHost: boolean) => {
  const [requests, setRequests] = useState<PlaybackRequest[]>([])

  const onRequestNotify = useCallback((req: PlaybackRequest) => {
    setRequests((prev) => [...prev, req])
  }, [])

  useSocketEvent(SOCKET_EVENTS.PLAYBACK_REQUEST_NOTIFY, onRequestNotify, isHost)

  const sendRequest = useCallback((type: RequestType, videoUrl?: string) => {
    connectSocket().emit(SOCKET_EVENTS.PLAYBACK_REQUEST, { type, videoUrl })
  }, [])

  const dismissRequest = useCallback((id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id))
  }, [])

  return { requests, sendRequest, dismissRequest }
}
