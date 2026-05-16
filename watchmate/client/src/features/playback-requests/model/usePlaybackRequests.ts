import { useState, useCallback } from 'react'
import { connectSocket } from '../../../shared/api'
import { useSocketEvent } from '../../../shared/lib'
import { SOCKET_EVENTS } from '../../../shared/config'

export type RequestType = 'pause' | 'play' | 'change-video'

export type PlaybackRequest = {
  id: string
  fromUserId: string
  fromUserName: string
  type: RequestType
  videoUrl?: string
}

export const usePlaybackRequests = (roomId: string | undefined, isHost: boolean) => {
  const [requests, setRequests] = useState<PlaybackRequest[]>([])

  const onRequestNotify = useCallback((req: PlaybackRequest) => {
    setRequests((prev) => [...prev, req])
  }, [])

  useSocketEvent<PlaybackRequest>(SOCKET_EVENTS.PLAYBACK_REQUEST_NOTIFY, onRequestNotify, isHost && !!roomId)

  const sendRequest = useCallback((type: RequestType, videoUrl?: string) => {
    if (!roomId) return
    connectSocket().emit(SOCKET_EVENTS.PLAYBACK_REQUEST, { roomId, type, videoUrl })
  }, [roomId])

  const dismissRequest = useCallback((id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id))
  }, [])

  return { requests, sendRequest, dismissRequest }
}
