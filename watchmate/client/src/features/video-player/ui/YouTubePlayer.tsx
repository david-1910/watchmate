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

      // Создаём дочерний div — YouTube заменит его на iframe, не трогая React-узел
      const playerDiv = document.createElement('div')
      playerDiv.style.width = '100%'
      playerDiv.style.height = '100%'
      containerRef.current.appendChild(playerDiv)

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
      if (containerRef.current) containerRef.current.innerHTML = ''
      onDestroy()
    }
  }, [videoId]) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
