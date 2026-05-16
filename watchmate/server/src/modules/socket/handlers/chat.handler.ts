import { Server, Socket } from 'socket.io'
import { state } from '../../state/state'
import { SOCKET_EVENTS } from '../../../shared/constants/socketEvents'

const MAX_MESSAGE_LENGTH = 500

const handleChatMessage = (
  io: Server,
  socket: Socket,
  data: { roomId: string; message: string }
): void => {
  const userRoom = state.userRooms.get(socket.id)
  if (!userRoom || userRoom !== data.roomId) return
  if (!data.message?.trim() || data.message.length > MAX_MESSAGE_LENGTH) return

  const userName = state.userNames.get(socket.id) ?? 'Аноним'
  const msg = { userId: socket.id, userName, message: data.message.trim(), timestamp: new Date() }
  state.addMessage(data.roomId, msg)
  io.to(data.roomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, msg)
}

export const registerChatHandlers = (io: Server, socket: Socket): void => {
  socket.on(SOCKET_EVENTS.CHAT_MESSAGE, (data) => handleChatMessage(io, socket, data))
}
