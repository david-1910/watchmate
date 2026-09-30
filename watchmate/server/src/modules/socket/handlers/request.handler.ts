import { hostService } from '../../members/host.service'
import { requestsService } from '../../playback/requests.service'
import { getSocketMember, isHost, onEvent } from '../socket.guards'
import { AppServer, AppSocket } from '../socket.types'
import { SOCKET_EVENTS } from '../../../shared/constants/socketEvents'
import { PlaybackRequestType } from '../../../shared/types'
import { isObject } from '../../../shared/utils/validators'

const REQUEST_TYPES: readonly PlaybackRequestType[] = ['pause', 'play', 'change-video']

type PlaybackRequestPayload = {
  type: PlaybackRequestType
  videoUrl?: string
}

type RequestAnswerPayload = {
  requestId: string
  accepted: boolean
}

const isRequestType = (value: unknown): value is PlaybackRequestType =>
  REQUEST_TYPES.some((type) => type === value)

const parsePlaybackRequest = (raw: unknown): PlaybackRequestPayload | null => {
  if (!isObject(raw) || !isRequestType(raw.type)) return null
  if (raw.videoUrl === undefined) return { type: raw.type }
  return typeof raw.videoUrl === 'string' ? { type: raw.type, videoUrl: raw.videoUrl } : null
}

const parseRequestAnswer = (raw: unknown): RequestAnswerPayload | null =>
  isObject(raw) && typeof raw.requestId === 'string' && typeof raw.accepted === 'boolean'
    ? { requestId: raw.requestId, accepted: raw.accepted }
    : null

// Запрос не-хоста уходит только сокетам хоста
const handlePlaybackRequest = (io: AppServer, socket: AppSocket, request: PlaybackRequestPayload): void => {
  const member = getSocketMember(socket)
  const hostId = hostService.getHostId(socket.data.roomId)
  if (!member || !hostId || isHost(socket)) return

  io.to(hostId).emit(SOCKET_EVENTS.PLAYBACK_REQUEST_NOTIFY, {
    id: requestsService.create(socket.data.roomId, member.userId, request.type),
    fromUserId: member.userId,
    fromUserName: member.userName,
    ...request,
  })
}

// Ответ хоста приходит отправителю запроса в его личный канал
const handleRequestAnswer = (io: AppServer, socket: AppSocket, { requestId, accepted }: RequestAnswerPayload): void => {
  if (!isHost(socket)) return
  const request = requestsService.answer(socket.data.roomId, requestId)
  if (!request) return
  io.to(request.fromUserId).emit(SOCKET_EVENTS.PLAYBACK_REQUEST_ANSWERED, { requestId, type: request.type, accepted })
}

export const registerRequestHandlers = (io: AppServer, socket: AppSocket): void => {
  onEvent(socket, SOCKET_EVENTS.PLAYBACK_REQUEST, parsePlaybackRequest, (data) => handlePlaybackRequest(io, socket, data))
  onEvent(socket, SOCKET_EVENTS.PLAYBACK_REQUEST_ANSWER, parseRequestAnswer, (data) => handleRequestAnswer(io, socket, data))
}
