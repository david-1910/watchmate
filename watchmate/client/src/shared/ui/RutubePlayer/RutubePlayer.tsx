import { useEffect, useRef } from 'react'
import { rutubeEmbedUrl, YT_STATE, type YTPlayer } from '../../lib'

type Props = {
  videoId: string
  privateKey: string | null
  onReady: (player: YTPlayer) => void
  onDestroy: () => void
  onStateChange: (state: number, currentTime: number) => void
}

const RUTUBE_ORIGIN = 'https://rutube.ru'

// player:changeState → коды состояний YouTube, чтобы синхронизация работала одинаково.
// Плеер шлёт «pause», хотя в документации — «paused»; учитываем оба. seeking/seeked не меняют состояние
const STATE_MAP: Record<string, number> = {
  playing: YT_STATE.PLAYING,
  pause: YT_STATE.PAUSED,
  paused: YT_STATE.PAUSED,
  stopped: YT_STATE.ENDED,
  ended: YT_STATE.ENDED,
}

type RutubeMessage = { type?: string; data?: Record<string, unknown> }

// Плеер Rutube через postMessage API (rutube.ru/info/embed). Наружу отдаёт тот же
// интерфейс, что и YouTube-плеер — useVideoPlayer не знает, какой плеер под ним
export const RutubePlayer = ({ videoId, privateKey, onReady, onDestroy, onStateChange }: Props) => {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const callbacksRef = useRef({ onReady, onStateChange })
  callbacksRef.current = { onReady, onStateChange }

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    // Позиция приходит событиями player:currentTime; между ними досчитываем по часам
    const status = { state: -1, time: 0, timeAt: Date.now(), volume: 100, muted: false, ready: false }

    const send = (type: string, data: object = {}) =>
      frame.contentWindow?.postMessage(JSON.stringify({ type, data }), RUTUBE_ORIGIN)

    const currentTime = () =>
      status.state === YT_STATE.PLAYING ? status.time + (Date.now() - status.timeAt) / 1000 : status.time

    const api: YTPlayer = {
      playVideo: () => send('player:play'),
      pauseVideo: () => send('player:pause'),
      seekTo: (seconds) => {
        status.time = seconds
        status.timeAt = Date.now()
        send('player:setCurrentTime', { time: seconds })
      },
      getCurrentTime: currentTime,
      getPlayerState: () => status.state,
      mute: () => { status.muted = true; send('player:mute') },
      unMute: () => { status.muted = false; send('player:unMute') },
      isMuted: () => status.muted,
      setVolume: (volume) => { status.volume = volume; send('player:setVolume', { volume: volume / 100 }) },
      getVolume: () => status.volume,
      destroy: () => {},
    }

    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.contentWindow || e.origin !== RUTUBE_ORIGIN) return
      let msg: RutubeMessage
      try {
        msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
      } catch {
        return
      }
      const data = msg.data ?? {}
      switch (msg.type) {
        case 'player:ready':
          if (status.ready) return
          status.ready = true
          callbacksRef.current.onReady(api)
          break
        case 'player:currentTime':
          if (typeof data.time === 'number') {
            status.time = data.time
            status.timeAt = Date.now()
          }
          break
        case 'player:changeState': {
          const state = STATE_MAP[String(data.state)]
          if (state === undefined || state === status.state) return
          status.state = state
          callbacksRef.current.onStateChange(state, currentTime())
          break
        }
        case 'player:playComplete':
          status.state = YT_STATE.ENDED
          callbacksRef.current.onStateChange(YT_STATE.ENDED, currentTime())
          break
        case 'player:volumeChange':
          if (typeof data.muted === 'boolean') status.muted = data.muted
          if (data.volume !== undefined) status.volume = Math.round(Number(data.volume) * 100)
          break
      }
    }

    window.addEventListener('message', onMessage)
    return () => {
      window.removeEventListener('message', onMessage)
      onDestroy()
    }
  }, [videoId, privateKey]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <iframe ref={frameRef} key={videoId} src={rutubeEmbedUrl(videoId, privateKey)} title="Rutube"
      width="100%" height="100%" style={{ border: 'none' }}
      allow="clipboard-write; autoplay; fullscreen" allowFullScreen />
  )
}
