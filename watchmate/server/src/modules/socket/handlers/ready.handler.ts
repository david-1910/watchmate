import { Server, Socket } from 'socket.io'
import { state } from '../../state/state'
import { SOCKET_EVENTS } from '../../../shared/constants/socketEvents'
import { emitCountdown } from '../../../shared/utils/countdown'

const handleToggleReady = (io: Server, socket: Socket, roomId: string): void => {
  if (!state.userRooms.get(socket.id)) return

  if (!state.readyUsers.has(roomId)) {
    state.readyUsers.set(roomId, new Set())
  }

  const roomReady = state.readyUsers.get(roomId)!
  roomReady.has(socket.id) ? roomReady.delete(socket.id) : roomReady.add(socket.id)

  const readyList = state.getRoomReadyUsers(roomId)
  const totalUsers = state.getRoomUsers(roomId).length
  const allReady = readyList.length === totalUsers && totalUsers > 0

  io.to(roomId).emit(SOCKET_EVENTS.READY_UPDATE, { readyUsers: readyList, allReady })

  if (allReady) {
    emitCountdown(io, roomId, () => {
      state.readyUsers.set(roomId, new Set())
      io.to(roomId).emit(SOCKET_EVENTS.READY_UPDATE, { readyUsers: [], allReady: false })
    })
  }
}

export const registerReadyHandlers = (io: Server, socket: Socket): void => {
  socket.on(SOCKET_EVENTS.TOGGLE_READY, (roomId: string) => handleToggleReady(io, socket, roomId))
}
