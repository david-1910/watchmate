// Реестр именованных таймеров. Ключи начинаются с roomId, чтобы при удалении
// комнаты можно было отменить все её таймеры одним вызовом
const timers = new Map<string, NodeJS.Timeout>()

export const cancelTimer = (key: string): void => {
  const timer = timers.get(key)
  if (!timer) return
  clearTimeout(timer)
  timers.delete(key)
}

export const scheduleTimer = (key: string, ms: number, fn: () => void): void => {
  cancelTimer(key)
  timers.set(key, setTimeout(() => {
    timers.delete(key)
    fn()
  }, ms))
}

export const cancelTimersByPrefix = (prefix: string): void => {
  for (const key of [...timers.keys()]) {
    if (key.startsWith(prefix)) cancelTimer(key)
  }
}
