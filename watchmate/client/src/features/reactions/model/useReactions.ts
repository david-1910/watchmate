import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { connectSocket } from '@/shared/api'
import { useSocketEvent, throttle } from '@/shared/lib'
import { SOCKET_EVENTS } from '@/shared/config'
import {
  buildReaction,
  REACTION_LIFETIME_MS,
  type Reaction,
} from '@/entities/reaction'
import { REACTION_INTERVAL_MS } from '../config/throttle'

type ReactionEvent = { userId: string; userName: string; emoji: string }

export const useReactions = () => {
  const [reactions, setReactions] = useState<Reaction[]>([])
  const timersRef = useRef(new Set<ReturnType<typeof setTimeout>>())

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach(clearTimeout)
      timers.clear()
    }
  }, [])

  const onReaction = useCallback((data: ReactionEvent) => {
    const reaction = buildReaction(data.emoji, data.userName)
    requestAnimationFrame(() => setReactions((prev) => [...prev, reaction]))

    const timer = setTimeout(() => {
      timersRef.current.delete(timer)
      setReactions((prev) => prev.filter((r) => r.id !== reaction.id))
    }, REACTION_LIFETIME_MS)
    timersRef.current.add(timer)
  }, [])

  useSocketEvent(SOCKET_EVENTS.REACTION, onReaction)

  const sendReaction = useMemo(
    () =>
      throttle((emoji: string) => {
        connectSocket().emit(SOCKET_EVENTS.REACTION, { emoji })
      }, REACTION_INTERVAL_MS),
    []
  )
  useEffect(() => () => sendReaction.cancel(), [sendReaction])

  return { reactions, sendReaction }
}
