import { Server, Socket } from 'socket.io'
import { state } from '../../state/state'
import { SOCKET_EVENTS } from '../../../shared/constants/socketEvents'

const handleReaction = (
  io: Server,
  socket: Socket,
  data: { roomId: string; emoji: string }
): void => {
  if (state.userRooms.get(socket.id) !== data.roomId) return
  const userName = state.userNames.get(socket.id) ?? 'Аноним'
  io.to(data.roomId).emit(SOCKET_EVENTS.REACTION, { userId: socket.id, userName, emoji: data.emoji })
}

export const registerReactionsHandlers = (io: Server, socket: Socket): void => {
  socket.on(SOCKET_EVENTS.REACTION, (data) => handleReaction(io, socket, data))
}
