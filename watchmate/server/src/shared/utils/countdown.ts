import { Server } from 'socket.io'
import { SOCKET_EVENTS } from '../constants/socketEvents'
import { COUNTDOWN_START, COUNTDOWN_INTERVAL_MS } from '../constants/countdown'

export const emitCountdown = (io: Server, roomId: string, onFinish?: () => void): void => {
  const counts = Array.from({ length: COUNTDOWN_START }, (_, i) => COUNTDOWN_START - i)

  counts.forEach((count, i) => {
    setTimeout(() => io.to(roomId).emit(SOCKET_EVENTS.COUNTDOWN, count), i * COUNTDOWN_INTERVAL_MS)
  })

  setTimeout(() => {
    io.to(roomId).emit(SOCKET_EVENTS.COUNTDOWN, 0)
    onFinish?.()
  }, COUNTDOWN_START * COUNTDOWN_INTERVAL_MS)
}
