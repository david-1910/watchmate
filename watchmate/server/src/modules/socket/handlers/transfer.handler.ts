import { Server, Socket } from 'socket.io'
import { state } from '../../state/state'
import { SOCKET_EVENTS } from '../../../shared/constants/socketEvents'

const handleTransferHost = (io: Server, socket: Socket, targetUserId: string): void => {
  const roomId = state.userRooms.get(socket.id)
  if (!roomId) return
  if (state.roomHosts.get(roomId) !== socket.id) return

  const users = state.getRoomUsers(roomId)
  const target = users.find((u) => u.userId === targetUserId)
  if (!target) return

  state.roomHosts.set(roomId, targetUserId)
  io.to(roomId).emit(SOCKET_EVENTS.HOST_UPDATE, targetUserId)
  console.log(`Хост передан: ${target.userName} в комнате ${roomId}`)
}

export const registerTransferHandlers = (io: Server, socket: Socket): void => {
  socket.on(SOCKET_EVENTS.TRANSFER_HOST, (targetUserId: string) =>
    handleTransferHost(io, socket, targetUserId)
  )
}
