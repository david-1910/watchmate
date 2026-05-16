import type { Server, Socket } from 'socket.io'
import { state } from '../../state/state'
import { SOCKET_EVENTS } from '../../../shared/constants/socketEvents'

type RequestType = 'pause' | 'play' | 'change-video'

type PlaybackRequestPayload = {
  roomId: string
  type: RequestType
  videoUrl?: string
}

const handlePlaybackRequest = (io: Server, socket: Socket, data: PlaybackRequestPayload): void => {
  const userRoom = state.userRooms.get(socket.id)
  if (!userRoom || userRoom !== data.roomId) return

  const hostSocketId = state.roomHosts.get(data.roomId)
  if (!hostSocketId || hostSocketId === socket.id) return

  const fromUserName = state.userNames.get(socket.id) ?? 'Аноним'

  io.to(hostSocketId).emit(SOCKET_EVENTS.PLAYBACK_REQUEST_NOTIFY, {
    id: `${socket.id}-${Date.now()}`,
    fromUserId: socket.id,
    fromUserName,
    type: data.type,
    videoUrl: data.videoUrl,
  })
}

export const registerRequestHandlers = (io: Server, socket: Socket): void => {
  socket.on(SOCKET_EVENTS.PLAYBACK_REQUEST, (data: PlaybackRequestPayload) =>
    handlePlaybackRequest(io, socket, data)
  )
}
