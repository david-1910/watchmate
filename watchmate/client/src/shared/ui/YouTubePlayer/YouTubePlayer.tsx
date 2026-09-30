import { useEffect, useRef } from 'react'
import { ensureYTApi, type YTPlayer } from '../../lib'

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
    const hostEl = containerRef.current

    ensureYTApi(() => {
      if (destroyed || !hostEl) return

      // Создаём дочерний div — YouTube заменит его на iframe, не трогая React-узел
      const playerDiv = document.createElement('div')
      playerDiv.style.width = '100%'
      playerDiv.style.height = '100%'
      hostEl.appendChild(playerDiv)

      const player = new window.YT.Player(playerDiv, {
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
      if (hostEl) hostEl.innerHTML = ''
      onDestroy()
    }
  }, [videoId]) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full" style={{ width: '100%', height: '100%' }} />
}
