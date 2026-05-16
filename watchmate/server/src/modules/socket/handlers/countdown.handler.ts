import { Server, Socket } from 'socket.io'
import { state } from '../../state/state'
import { SOCKET_EVENTS } from '../../../shared/constants/socketEvents'
import { emitCountdown } from '../../../shared/utils/countdown'

const handleStartCountdown = (io: Server, socket: Socket, roomId: string): void => {
  if (!state.userRooms.get(socket.id)) return
  emitCountdown(io, roomId)
}

export const registerCountdownHandlers = (io: Server, socket: Socket): void => {
  socket.on(SOCKET_EVENTS.START_COUNTDOWN, (roomId: string) => handleStartCountdown(io, socket, roomId))
}
