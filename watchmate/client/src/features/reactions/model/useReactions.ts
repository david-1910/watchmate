import { useState, useCallback, useRef, useEffect } from 'react'
import { connectSocket } from '../../../shared/api'
import { useSocketEvent } from '../../../shared/lib'
import {
  SOCKET_EVENTS,
  REACTION_LIFETIME_MS,
  REACTION_LEFT_MIN,
  REACTION_LEFT_RANGE,
  REACTION_DURATION_BASE,
  REACTION_DURATION_VARIANCE,
} from '../../../shared/config'
import type { Reaction } from '../../../shared/types'

const buildReaction = (emoji: string, userName: string): Reaction => ({
  id: performance.now() + Math.random() * 10000,
  userName,
  emoji,
  left: Math.random() * REACTION_LEFT_RANGE + REACTION_LEFT_MIN,
  direction: Math.random() > 0.5 ? 'left' : 'right',
  duration: REACTION_DURATION_BASE + Math.random() * REACTION_DURATION_VARIANCE,
  zIndex: Math.floor(Math.random() * 100),
})

export const useReactions = (roomId: string | undefined) => {
  const [reactions, setReactions] = useState<Reaction[]>([])
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const onReaction = useCallback(
    (data: { userId: string; userName: string; emoji: string }) => {
      const reaction = buildReaction(data.emoji, data.userName)

      requestAnimationFrame(() => {
        if (mountedRef.current) {
          setReactions((prev) => [...prev, reaction])
        }
      })

      const timer = setTimeout(() => {
        if (mountedRef.current) {
          setReactions((prev) => prev.filter((r) => r.id !== reaction.id))
        }
      }, REACTION_LIFETIME_MS)

      return () => clearTimeout(timer)
    },
    []
  )

  useSocketEvent<{ userId: string; userName: string; emoji: string }>(
    SOCKET_EVENTS.REACTION,
    onReaction,
    !!roomId
  )

  const sendReaction = (emoji: string) => {
    if (!roomId) return
    connectSocket().emit(SOCKET_EVENTS.REACTION, { roomId, emoji })
  }

  return { reactions, sendReaction }
}
