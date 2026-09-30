import { hostService } from '../../members/host.service'
import { getSocketMember, isHost, onEvent } from '../socket.guards'
import { AppServer, AppSocket } from '../socket.types'
import { SOCKET_EVENTS } from '../../../shared/constants/socketEvents'
import { generateId } from '../../../shared/utils/generators'
import { isObject } from '../../../shared/utils/validators'

const REQUEST_TYPES = ['pause', 'play', 'change-video'] as const

type PlaybackRequestPayload = {
  type: (typeof REQUEST_TYPES)[number]
  videoUrl?: string
}

const isRequestType = (value: unknown): value is PlaybackRequestPayload['type'] =>
  REQUEST_TYPES.some((type) => type === value)

const parsePlaybackRequest = (raw: unknown): PlaybackRequestPayload | null => {
  if (!isObject(raw) || !isRequestType(raw.type)) return null
  if (raw.videoUrl === undefined) return { type: raw.type }
  return typeof raw.videoUrl === 'string' ? { type: raw.type, videoUrl: raw.videoUrl } : null
}

// Запрос не-хоста уходит только сокетам хоста
const handlePlaybackRequest = (io: AppServer, socket: AppSocket, request: PlaybackRequestPayload): void => {
  const member = getSocketMember(socket)
  const hostId = hostService.getHostId(socket.data.roomId)
  if (!member || !hostId || isHost(socket)) return

  io.to(hostId).emit(SOCKET_EVENTS.PLAYBACK_REQUEST_NOTIFY, {
    id: generateId(),
    fromUserId: member.userId,
    fromUserName: member.userName,
    ...request,
  })
}

export const registerRequestHandlers = (io: AppServer, socket: AppSocket): void => {
  onEvent(socket, SOCKET_EVENTS.PLAYBACK_REQUEST, parsePlaybackRequest, (data) => handlePlaybackRequest(io, socket, data))
}
