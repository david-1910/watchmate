import { useEffect } from 'react'
import { connectSocket } from '../api'

export const useSocketEvent = <T>(
  event: string,
  handler: (data: T) => void,
  enabled = true
): void => {
  useEffect(() => {
    if (!enabled) return
    const socket = connectSocket()
    socket.on(event, handler)
    return () => { socket.off(event, handler) }
  }, [event, handler, enabled])
}
