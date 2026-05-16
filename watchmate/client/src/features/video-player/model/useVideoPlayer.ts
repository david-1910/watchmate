import { useState, useCallback, useRef, useEffect } from 'react'
import { connectSocket } from '../../../shared/api'
import { useSocketEvent } from '../../../shared/lib'
import { SOCKET_EVENTS, COUNTDOWN_INTERVAL_MS } from '../../../shared/config'
import { YT_STATE, type YTPlayer } from './ytPlayer'

const PLAYING_DELAY_MS = COUNTDOWN_INTERVAL_MS * 1.5

type PlaybackUpdate = { isPlaying: boolean; currentTime: number }

export const useVideoPlayer = (roomId: string | undefined, isHost: boolean) => {
  const [videoUrl, setVideoUrl] = useState('')
  const [localVideo, setLocalVideo] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [inputUrl, setInputUrl] = useState('')

  const mountedRef = useRef(true)
  const isHostRef = useRef(isHost)
  const ytPlayerRef = useRef<YTPlayer | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const pendingPlaybackRef = useRef<PlaybackUpdate | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    isHostRef.current = isHost
  }, [isHost])

  const applyPlayback = useCallback(({ isPlaying: playing, currentTime }: PlaybackUpdate) => {
    if (ytPlayerRef.current) {
      const yt = ytPlayerRef.current
      if (Math.abs((yt.getCurrentTime?.() ?? 0) - currentTime) > 1.5) {
        yt.seekTo(currentTime, true)
      }
      playing ? yt.playVideo() : yt.pauseVideo()
    } else if (videoRef.current) {
      const v = videoRef.current
      if (Math.abs(v.currentTime - currentTime) > 1.5) {
        v.currentTime = currentTime
      }
      playing ? void v.play() : v.pause()
    } else {
      pendingPlaybackRef.current = { isPlaying: playing, currentTime }
    }
  }, [])

  const onVideoUpdate = useCallback((url: string) => {
    setVideoUrl(url)
    setLocalVideo(null)
    setIsPlaying(false)
    pendingPlaybackRef.current = null
  }, [])

  const onLocalFile = useCallback((fileName: string | null) => {
    if (fileName) setVideoUrl('')
    setLocalVideo(null)
    setIsPlaying(false)
    pendingPlaybackRef.current = null
  }, [])

  const onCountdown = useCallback((count: number) => {
    setCountdown(count)
    if (count === 0) {
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          setCountdown(null)
          setIsPlaying(true)
          ytPlayerRef.current?.playVideo()
          if (videoRef.current) void videoRef.current.play()
        }
      }, PLAYING_DELAY_MS)
      return () => clearTimeout(timer)
    }
  }, [])

  const onPlaybackUpdate = useCallback((update: PlaybackUpdate) => {
    setIsPlaying(update.isPlaying)
    applyPlayback(update)
  }, [applyPlayback])

  useSocketEvent<string>(SOCKET_EVENTS.VIDEO_UPDATE, onVideoUpdate, !!roomId)
  useSocketEvent<string | null>(SOCKET_EVENTS.LOCAL_FILE_UPDATE, onLocalFile, !!roomId)
  useSocketEvent<number>(SOCKET_EVENTS.COUNTDOWN, onCountdown, !!roomId)
  useSocketEvent<PlaybackUpdate>(SOCKET_EVENTS.PLAYBACK_UPDATE, onPlaybackUpdate, !!roomId)

  const emitPlaybackSync = useCallback((playing: boolean, currentTime: number) => {
    if (!isHostRef.current || !roomId) return
    connectSocket().emit(SOCKET_EVENTS.PLAYBACK_SYNC, { roomId, isPlaying: playing, currentTime })
  }, [roomId])

  const onYTReady = useCallback((player: YTPlayer) => {
    ytPlayerRef.current = player
    if (pendingPlaybackRef.current) {
      applyPlayback(pendingPlaybackRef.current)
      pendingPlaybackRef.current = null
    }
  }, [applyPlayback])

  const onYTDestroy = useCallback(() => {
    ytPlayerRef.current = null
  }, [])

  const onYTStateChange = useCallback((ytState: number, currentTime: number) => {
    if (!isHostRef.current || !roomId) return
    if (ytState === YT_STATE.PLAYING || ytState === YT_STATE.PAUSED) {
      emitPlaybackSync(ytState === YT_STATE.PLAYING, currentTime)
    }
  }, [roomId, emitPlaybackSync])

  const onLocalVideoPlay = useCallback(() => {
    if (!videoRef.current) return
    emitPlaybackSync(true, videoRef.current.currentTime)
  }, [emitPlaybackSync])

  const onLocalVideoPause = useCallback(() => {
    if (!videoRef.current) return
    emitPlaybackSync(false, videoRef.current.currentTime)
  }, [emitPlaybackSync])

  const onLocalVideoSeeked = useCallback(() => {
    if (!videoRef.current) return
    emitPlaybackSync(!videoRef.current.paused, videoRef.current.currentTime)
  }, [emitPlaybackSync])

  const syncPlayback = useCallback((playing: boolean) => {
    if (!roomId) return
    const currentTime = ytPlayerRef.current?.getCurrentTime()
      ?? videoRef.current?.currentTime
      ?? 0
    applyPlayback({ isPlaying: playing, currentTime })
    emitPlaybackSync(playing, currentTime)
  }, [roomId, applyPlayback, emitPlaybackSync])

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
    ytPlayerRef.current = null
    pendingPlaybackRef.current = null
  }

  return {
    videoUrl, localVideo, isPlaying, countdown,
    inputUrl, setInputUrl,
    shareVideo, clearVideo, syncPlayback,
    videoRef,
    onYTReady, onYTDestroy, onYTStateChange,
    onLocalVideoPlay, onLocalVideoPause, onLocalVideoSeeked,
  }
}
