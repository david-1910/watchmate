import { state } from '../state/state'
import { ReadyState } from '../../shared/types'
import { cancelTimersByPrefix } from '../../shared/utils/timers'

// Ключ таймера шага отсчёта; общий префикс позволяет отменить весь отсчёт разом
export const countdownTimerKey = (roomId: string, count: number | '' = ''): string => `${roomId}:countdown:${count}`

type StartResult = 'started' | 'not-ready' | 'running'

// Хост готов по умолчанию и в подсчёте не участвует.
// allReady — все онлайн-зрители готовы (если зрителей нет — true); готовность офлайн-участников сохраняется
const getState = (roomId: string): ReadyState => {
  const ready = state.readyUsers.get(roomId) ?? new Set<string>()
  const hostId = state.roomHosts.get(roomId)
  const viewers = state.getOnlineMembers(roomId).filter((m) => m.userId !== hostId)
  return {
    readyUsers: [...ready].filter((id) => id !== hostId),
    allReady: viewers.every((m) => ready.has(m.userId)),
  }
}

const toggle = (roomId: string, userId: string): ReadyState => {
  const ready = state.readyUsers.get(roomId) ?? new Set<string>()
  if (ready.has(userId)) ready.delete(userId)
  else ready.add(userId)
  state.readyUsers.set(roomId, ready)
  return getState(roomId)
}

// Отсчёт запускает хост, когда все зрители готовы; второй не стартует, пока идёт первый
const start = (roomId: string): StartResult => {
  if (state.activeCountdowns.has(roomId)) return 'running'
  if (!getState(roomId).allReady) return 'not-ready'
  state.activeCountdowns.add(roomId)
  return 'started'
}

// Конец отсчёта сбрасывает готовность; null, если комнаты уже нет
const finishCountdown = (roomId: string): ReadyState | null => {
  if (!state.rooms.has(roomId)) return null
  state.activeCountdowns.delete(roomId)
  state.readyUsers.set(roomId, new Set())
  return getState(roomId)
}

// Видео сменили или закрыли во время отсчёта — отсчёт отменяется, иначе он запустил бы уже другое видео
const cancelCountdown = (roomId: string): void => {
  if (!state.activeCountdowns.delete(roomId)) return
  cancelTimersByPrefix(countdownTimerKey(roomId))
}

// true, если участник был в списке готовых
const remove = (roomId: string, userId: string): boolean => state.readyUsers.get(roomId)?.delete(userId) ?? false

export const readyService = { getState, toggle, start, finishCountdown, cancelCountdown, remove }
