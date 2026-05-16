import { useState, useCallback, useRef, useEffect } from 'react'
import { connectSocket } from '../../../shared/api'
import { useSocketEvent } from '../../../shared/lib'
import { SOCKET_EVENTS, COUNTDOWN_INTERVAL_MS } from '../../../shared/config'

const PLAYING_DELAY_MS = COUNTDOWN_INTERVAL_MS * 1.5

export const useVideoPlayer = (roomId: string | undefined) => {
  const [videoUrl, setVideoUrl] = useState('')
  const [localVideo, setLocalVideo] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [inputUrl, setInputUrl] = useState('')
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const onVideoUpdate = useCallback((url: string) => {
    setVideoUrl(url)
    setLocalVideo(null)
    setIsPlaying(false)
  }, [])

  const onLocalFile = useCallback((fileName: string | null) => {
    if (fileName) setVideoUrl('')
    setLocalVideo(null)
    setIsPlaying(false)
  }, [])

  const onCountdown = useCallback((count: number) => {
    setCountdown(count)
    if (count === 0) {
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          setCountdown(null)
          setIsPlaying(true)
        }
      }, PLAYING_DELAY_MS)
      return () => clearTimeout(timer)
    }
  }, [])

  useSocketEvent<string>(SOCKET_EVENTS.VIDEO_UPDATE, onVideoUpdate, !!roomId)
  useSocketEvent<string | null>(SOCKET_EVENTS.LOCAL_FILE_UPDATE, onLocalFile, !!roomId)
  useSocketEvent<number>(SOCKET_EVENTS.COUNTDOWN, onCountdown, !!roomId)

  const shareVideo = (url: string) => {
    if (!url.trim() || !roomId) return
    connectSocket().emit(SOCKET_EVENTS.SHARE_VIDEO, { roomId, videoUrl: url.trim() })
    setInputUrl('')
  }

  const clearVideo = () => {
    if (!roomId) return
    connectSocket().emit(SOCKET_EVENTS.CLEAR_VIDEO, roomId)
    setLocalVideo(null)
    setIsPlaying(false)
  }

  return {
    videoUrl, localVideo, isPlaying, countdown,
    inputUrl, setInputUrl,
    shareVideo, clearVideo,
  }
}
