import { state } from '../state/state'
import { env } from '../../shared/config/env'
import { roomEvents } from '../../shared/utils/roomEvents'
import { scheduleTimer, cancelTimer } from '../../shared/utils/timers'

type TransferResult = 'ok' | 'not-found' | 'offline'

const hostTimerKey = (roomId: string) => `${roomId}:host`

const getHostId = (roomId: string): string | null => state.roomHosts.get(roomId) ?? null

const isHost = (roomId: string, userId: string): boolean => getHostId(roomId) === userId

const isHostOnline = (roomId: string): boolean => {
  const hostId = getHostId(roomId)
  return !!hostId && (state.getMember(roomId, hostId)?.sockets ?? 0) > 0
}

const setHost = (roomId: string, hostId: string | null): void => {
  cancelTimer(hostTimerKey(roomId))
  if (getHostId(roomId) === hostId) return
  if (hostId) state.roomHosts.set(roomId, hostId)
  else state.roomHosts.delete(roomId)
  roomEvents.emit('host-changed', roomId, hostId)
  console.log(`Хост комнаты ${roomId}: ${hostId ?? 'нет'}`)
}

// Роль переходит к онлайн-участнику, который вошёл раньше всех; если онлайн никого — null
const handOver = (roomId: string): void => {
  const currentHostId = getHostId(roomId)
  const next = state.getOnlineMembers(roomId).find((m) => m.userId !== currentHostId)
  setHost(roomId, next?.userId ?? null)
}

const scheduleHandOver = (roomId: string): void =>
  scheduleTimer(hostTimerKey(roomId), env.hostGraceMs, () => handOver(roomId))

const cancelHandOver = (roomId: string): void => cancelTimer(hostTimerKey(roomId))

const transfer = (roomId: string, targetUserId: string): TransferResult => {
  const target = state.getMember(roomId, targetUserId)
  if (!target) return 'not-found'
  if (target.sockets === 0) return 'offline'
  setHost(roomId, targetUserId)
  return 'ok'
}

export const hostService = { getHostId, isHost, isHostOnline, setHost, handOver, scheduleHandOver, cancelHandOver, transfer }
