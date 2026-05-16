import { Server, Socket } from 'socket.io'
import { state } from '../../state/state'
import { SOCKET_EVENTS } from '../../../shared/constants/socketEvents'

const isInRoom = (socket: Socket, roomId: string): boolean =>
  state.userRooms.get(socket.id) === roomId

const handleShareVideo = (
  io: Server,
  socket: Socket,
  data: { roomId: string; videoUrl: string }
): void => {
  if (!isInRoom(socket, data.roomId)) return
  io.to(data.roomId).emit(SOCKET_EVENTS.VIDEO_UPDATE, data.videoUrl)
}

const handleClearVideo = (io: Server, socket: Socket, roomId: string): void => {
  if (!isInRoom(socket, roomId)) return
  io.to(roomId).emit(SOCKET_EVENTS.VIDEO_UPDATE, '')
  io.to(roomId).emit(SOCKET_EVENTS.LOCAL_FILE_UPDATE, null)
}

const handleShareLocalFile = (
  io: Server,
  socket: Socket,
  data: { roomId: string; fileName: string }
): void => {
  if (!isInRoom(socket, data.roomId)) return
  io.to(data.roomId).emit(SOCKET_EVENTS.LOCAL_FILE_UPDATE, data.fileName)
}

export const registerVideoHandlers = (io: Server, socket: Socket): void => {
  socket.on(SOCKET_EVENTS.SHARE_VIDEO, (data) => handleShareVideo(io, socket, data))
  socket.on(SOCKET_EVENTS.CLEAR_VIDEO, (roomId: string) => handleClearVideo(io, socket, roomId))
  socket.on(SOCKET_EVENTS.SHARE_LOCAL_FILE, (data) => handleShareLocalFile(io, socket, data))
}
