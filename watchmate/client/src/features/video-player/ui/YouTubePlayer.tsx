import { useEffect, useRef } from 'react'
import { ensureYTApi, type YTPlayer } from '../model/ytPlayer'

type Props = {
  videoId: string
  onReady: (player: YTPlayer) => void
  onDestroy: () => void
  onStateChange: (state: number, currentTime: number) => void
}

export const YouTubePlayer = ({ videoId, onReady, onDestroy, onStateChange }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const callbackRef = useRef(onStateChange)
  callbackRef.current = onStateChange

  useEffect(() => {
    let destroyed = false

    ensureYTApi(() => {
      if (destroyed || !containerRef.current) return

      const player = new window.YT.Player(containerRef.current, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady: () => {
            if (!destroyed) onReady(player)
          },
          onStateChange: (e: { data: number }) => {
            callbackRef.current(e.data, player.getCurrentTime())
          },
        },
      })
    })

    return () => {
      destroyed = true
      onDestroy()
    }
  }, [videoId]) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
