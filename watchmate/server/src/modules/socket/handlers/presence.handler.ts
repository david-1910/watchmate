import { membersService } from '../../members/members.service'
import { onEvent } from '../socket.guards'
import { AppServer, AppSocket } from '../socket.types'

// Служебное событие Socket.IO, не часть SOCKET_EVENTS
const DISCONNECT = 'disconnect'

// Сокет прошёл аутентификацию: комната + личный канал участника (для адресной рассылки)
export const registerPresenceHandlers = (_io: AppServer, socket: AppSocket): void => {
  const { roomId, userId } = socket.data
  socket.join([roomId, userId])
  membersService.connect(roomId, userId)
  onEvent(socket, DISCONNECT, () => true, () => membersService.disconnect(roomId, userId))
}
