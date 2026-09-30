import { membersService } from '../members/members.service'
import { hostService } from '../members/host.service'
import { AppSocket } from './socket.types'
import { Member } from '../../shared/types'

// Участник сокета, если он всё ещё в комнате
export const getSocketMember = (socket: AppSocket): Member | undefined =>
  membersService.getMember(socket.data.roomId, socket.data.userId)

const isInRoom = (socket: AppSocket): boolean => !!getSocketMember(socket)

export const isHost = (socket: AppSocket): boolean =>
  isInRoom(socket) && hostService.isHost(socket.data.roomId, socket.data.userId)

// Подписка на событие: payload проверяется parse (null — молча отбросить),
// исключение в обработчике не роняет процесс
export const onEvent = <T>(
  socket: AppSocket,
  event: string,
  parse: (raw: unknown) => T | null,
  handler: (data: T) => void
): void => {
  socket.on(event, (raw: unknown) => {
    try {
      const data = parse(raw)
      if (data !== null) handler(data)
    } catch (err) {
      console.error(`[SOCKET] Ошибка в обработчике "${event}":`, (err as Error).message)
    }
  })
}
