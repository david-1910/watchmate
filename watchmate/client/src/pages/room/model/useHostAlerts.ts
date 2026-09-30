import { useEffect, useRef } from 'react'
import { playNotificationSound, playRequestSound } from '@/shared/lib'

// Звуковые уведомления хоста о новых предложениях и запросах зрителей
export const useHostAlerts = (
  isHost: boolean,
  suggestionsCount: number,
  requestsCount: number
): void => {
  const prevSuggestionsRef = useRef(0)
  useEffect(() => {
    if (isHost && suggestionsCount > prevSuggestionsRef.current) {
      playNotificationSound()
    }
    prevSuggestionsRef.current = suggestionsCount
  }, [suggestionsCount, isHost])

  const prevRequestsRef = useRef(0)
  useEffect(() => {
    if (isHost && requestsCount > prevRequestsRef.current) {
      playRequestSound()
    }
    prevRequestsRef.current = requestsCount
  }, [requestsCount, isHost])
}
