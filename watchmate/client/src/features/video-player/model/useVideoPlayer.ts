import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { connectSocket } from '@/shared/api'
import { useSocketEvent, throttle, YT_STATE, type YTPlayer } from '@/shared/lib'
import { SOCKET_EVENTS, COUNTDOWN_INTERVAL_MS } from '@/shared/config'
import {
  setVideo,
  clearVideo as clearRoomVideo,
  type PlaybackState,
  type RoomSnapshot,
} from '@/entities/room'
import { PLAYBACK_SYNC_INTERVAL_MS, SEEK_TOLERANCE_SEC, AUTOPLAY_CHECK_MS } from '../config/sync'

const PLAYING_DELAY_MS = COUNTDOWN_INTERVAL_MS * 1.5

type Options = {
  // Вызывается у хоста, когда YouTube-видео доиграло до конца
  onEnded?: () => void
}

export const useVideoPlayer = (
  roomId: string,
  isHost: boolean,
  snapshot: RoomSnapshot | null,
  { onEnded }: Options = {}
) => {
  const [videoUrl, setVideoUrl] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoStarted, setVideoStarted] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  // Браузер не дал играть со звуком — играем без звука, пока пользователь не нажмёт «Включить звук»
  const [soundBlocked, setSoundBlocked] = useState(false)

  const mountedRef = useRef(true)
  const isHostRef = useRef(isHost)
  const onEndedRef = useRef(onEnded)
  const videoUrlRef = useRef('')
  const ytPlayerRef = useRef<YTPlayer | null>(null)
  const pendingPlaybackRef = useRef<PlaybackState | null>(null)
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoplayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Позиция паузы для ещё не запущенного плеера: seek+pause на нём оставляет чёрный экран,
  // поэтому переходим на неё при первом запуске
  const resumeAtRef = useRef<number | null>(null)
  // Ожидаемое состояние по последней команде — чтобы после проверки автовоспроизведения встать на нужную позицию
  const expectedRef = useRef({ playing: false, time: 0, at: 0 })

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current)
      if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current)
    }
  }, [])

  useEffect(() => {
    isHostRef.current = isHost
    onEndedRef.current = onEnded
  }, [isHost, onEnded])

  // Автовоспроизведение со звуком браузер разрешает только после клика на странице.
  // Если плеер так и не заиграл — запускаем без звука (это разрешено всегда) с ожидаемой позиции
  const ensurePlaying = useCallback(() => {
    if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current)
    autoplayTimerRef.current = setTimeout(() => {
      const yt = ytPlayerRef.current
      const expected = expectedRef.current
      if (!mountedRef.current || !yt || !expected.playing) return
      const state = yt.getPlayerState()
      if (state === YT_STATE.PLAYING || state === YT_STATE.BUFFERING) return
      yt.mute()
      yt.seekTo(expected.time + (Date.now() - expected.at) / 1000, true)
      yt.playVideo()
      setSoundBlocked(true)
    }, AUTOPLAY_CHECK_MS)
  }, [])

  const applyPlayback = useCallback(({ isPlaying: playing, currentTime }: PlaybackState) => {
    expectedRef.current = { playing, time: currentTime, at: Date.now() }
    const yt = ytPlayerRef.current
    if (!yt) {
      pendingPlaybackRef.current = { isPlaying: playing, currentTime }
      return
    }
    const state = yt.getPlayerState()
    if (!playing && (state === YT_STATE.UNSTARTED || state === YT_STATE.CUED)) {
      resumeAtRef.current = currentTime
      return
    }
    resumeAtRef.current = null
    if (Math.abs((yt.getCurrentTime?.() ?? 0) - currentTime) > SEEK_TOLERANCE_SEC) {
      yt.seekTo(currentTime, true)
    }
    if (playing) {
      yt.playVideo()
      ensurePlaying()
    } else yt.pauseVideo()
  }, [ensurePlaying])

  // Клик пользователя — после него браузер разрешает звук
  const enableSound = useCallback(() => {
    ytPlayerRef.current?.unMute()
    setSoundBlocked(false)
  }, [])

  // Звук включается сам при первом действии на странице (клик, касание, клавиша) —
  // раньше браузер не разрешит, а отдельная кнопка «Включить звук» не нужна
  useEffect(() => {
    if (!soundBlocked) return
    const options = { capture: true, once: true } as const
    document.addEventListener('pointerdown', enableSound, options)
    document.addEventListener('keydown', enableSound, options)
    return () => {
      document.removeEventListener('pointerdown', enableSound, options)
      document.removeEventListener('keydown', enableSound, options)
    }
  }, [soundBlocked, enableSound])


  const onVideoUpdate = useCallback((url: string) => {
    resumeAtRef.current = null
    videoUrlRef.current = url
    setVideoUrl(url)
    setIsPlaying(false)
    setVideoStarted(false)
    // Видео сменили во время отсчёта — сервер отменил его, убираем цифры
    if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current)
    setCountdown(null)
    if (!url) ytPlayerRef.current = null
    setSoundBlocked(false)
    pendingPlaybackRef.current = null
  }, [])

  const onPlaybackUpdate = useCallback((update: PlaybackState) => {
    setIsPlaying(update.isPlaying)
    // currentTime > 0 — видео уже шло (пауза на середине), оверлей не нужен
    if (update.isPlaying || update.currentTime > 0) setVideoStarted(true)
    applyPlayback(update)
  }, [applyPlayback])

  // Снапшот приходит на каждый connect: плеер пересоздаём, только если сменилось видео
  useEffect(() => {
    if (!snapshot) return
    if (snapshot.video !== videoUrlRef.current) onVideoUpdate(snapshot.video)
    if (snapshot.playback) onPlaybackUpdate(snapshot.playback)
  }, [snapshot, onVideoUpdate, onPlaybackUpdate])

  const onCountdown = useCallback((count: number) => {
    setCountdown(count)
    if (count !== 0) return
    if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current)
    countdownTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return
      setCountdown(null)
      setIsPlaying(true)
      setVideoStarted(true)
      expectedRef.current = { playing: true, time: ytPlayerRef.current?.getCurrentTime() ?? 0, at: Date.now() }
      ytPlayerRef.current?.playVideo()
      ensurePlaying()
    }, PLAYING_DELAY_MS)
  }, [ensurePlaying])

  useSocketEvent(SOCKET_EVENTS.VIDEO_UPDATE, onVideoUpdate)
  useSocketEvent(SOCKET_EVENTS.COUNTDOWN, onCountdown)
  useSocketEvent(SOCKET_EVENTS.PLAYBACK_UPDATE, onPlaybackUpdate)

  const emitPlaybackSync = useMemo(
    () =>
      throttle((isPlaying: boolean, currentTime: number) => {
        if (!isHostRef.current) return
        const payload: PlaybackState = { isPlaying, currentTime }
        connectSocket().emit(SOCKET_EVENTS.PLAYBACK_SYNC, payload)
      }, PLAYBACK_SYNC_INTERVAL_MS),
    []
  )
  useEffect(() => () => emitPlaybackSync.cancel(), [emitPlaybackSync])

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
    // Первый запуск после паузы на ещё не запущенном плеере — сначала встаём на позицию паузы.
    // Рассылку пропускаем: после перемотки придёт PLAYING уже с правильным временем
    if (ytState === YT_STATE.PLAYING && resumeAtRef.current !== null) {
      const resumeAt = resumeAtRef.current
      resumeAtRef.current = null
      ytPlayerRef.current?.seekTo(resumeAt, true)
      if (isHostRef.current) return
    }
    if (!isHostRef.current) {
      // Зритель не управляет воспроизведением: заиграло при паузе хоста (медиаклавиша, пробел в iframe) — снова пауза
      if (ytState === YT_STATE.PLAYING && !expectedRef.current.playing) ytPlayerRef.current?.pauseVideo()
      return
    }
    if (ytState === YT_STATE.PLAYING || ytState === YT_STATE.PAUSED) {
      emitPlaybackSync(ytState === YT_STATE.PLAYING, currentTime)
    } else if (ytState === YT_STATE.ENDED) {
      onEndedRef.current?.()
    }
  }, [emitPlaybackSync])

  const syncPlayback = useCallback((playing: boolean) => {
    const currentTime = ytPlayerRef.current?.getCurrentTime() ?? 0
    applyPlayback({ isPlaying: playing, currentTime })
    emitPlaybackSync(playing, currentTime)
  }, [applyPlayback, emitPlaybackSync])

  // Ошибки команд игнорируем: состояние всё равно приходит через video-update
  const shareVideo = (url: string) => {
    if (!url.trim()) return
    setVideo(roomId, url.trim()).catch(() => {})
  }

  const clearVideo = () => {
    clearRoomVideo(roomId).catch(() => {})
  }

  return {
    videoUrl, isPlaying, videoStarted, countdown, soundBlocked, enableSound,
    shareVideo, clearVideo, syncPlayback,
    onYTReady, onYTDestroy, onYTStateChange,
  }
}
