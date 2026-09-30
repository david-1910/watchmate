import { membersService } from '../members/members.service'
import { readyService } from '../ready/ready.service'
import { AppServer } from './socket.types'
import { SOCKET_EVENTS } from '../../shared/constants/socketEvents'
import { roomEvents } from '../../shared/utils/roomEvents'
import { SessionEndReason } from '../../shared/types'

// Сначала session-ended, затем закрытие сокетов (пакеты идут по одному соединению по порядку)
const endSession = (io: AppServer, channel: string, reason: SessionEndReason): void => {
  io.to(channel).emit(SOCKET_EVENTS.SESSION_ENDED, { reason })
  io.in(channel).disconnectSockets()
}

// Доменные события жизненного цикла → рассылки по сокетам
export const subscribeRoomEvents = (io: AppServer): void => {
  roomEvents.on('users-changed', (roomId) => {
    io.to(roomId).emit(SOCKET_EVENTS.USERS_UPDATE, membersService.getUsers(roomId))
  })
  roomEvents.on('host-changed', (roomId, hostId) => {
    // host-update несёт строку; null означает, что онлайн никого нет и рассылать некому
    if (hostId) io.to(roomId).emit(SOCKET_EVENTS.HOST_UPDATE, hostId)
    // Хост не участвует в подсчёте готовности — при смене хоста allReady пересчитывается
    io.to(roomId).emit(SOCKET_EVENTS.READY_UPDATE, readyService.getState(roomId))
  })
  roomEvents.on('ready-changed', (roomId) => {
    io.to(roomId).emit(SOCKET_EVENTS.READY_UPDATE, readyService.getState(roomId))
  })
  roomEvents.on('member-removed', (_roomId, userId) => endSession(io, userId, 'member-removed'))
  roomEvents.on('room-deleted', (roomId) => endSession(io, roomId, 'room-deleted'))
}
