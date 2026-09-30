import { readyService, countdownTimerKey } from './ready.service'
import { AppServer } from '../socket/socket.types'
import { SOCKET_EVENTS } from '../../shared/constants/socketEvents'
import { COUNTDOWN_START, COUNTDOWN_INTERVAL_MS } from '../../shared/constants/countdown'
import { scheduleTimer } from '../../shared/utils/timers'

// Рассылает countdown 3→0, затем сбрасывает готовность.
// Таймеры с ключом комнаты отменяются при её удалении
export const emitCountdown = (io: AppServer, roomId: string): void => {
  for (let i = 0; i <= COUNTDOWN_START; i++) {
    const count = COUNTDOWN_START - i
    scheduleTimer(countdownTimerKey(roomId, count), i * COUNTDOWN_INTERVAL_MS, () => {
      io.to(roomId).emit(SOCKET_EVENTS.COUNTDOWN, count)
      if (count > 0) return
      const ready = readyService.finishCountdown(roomId)
      if (ready) io.to(roomId).emit(SOCKET_EVENTS.READY_UPDATE, ready)
    })
  }
}
