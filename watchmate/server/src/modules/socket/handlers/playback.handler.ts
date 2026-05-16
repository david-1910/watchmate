import type { Server, Socket } from 'socket.io'
import { state } from '../../state/state'
import { SOCKET_EVENTS } from '../../../shared/constants/socketEvents'

type PlaybackSyncPayload = { roomId: string; isPlaying: boolean; currentTime: number }

const handlePlaybackSync = (io: Server, socket: Socket, data: PlaybackSyncPayload): void => {
  const userRoom = state.userRooms.get(socket.id)
  if (!userRoom || userRoom !== data.roomId) return

  state.roomPlayback.set(data.roomId, {
    isPlaying: data.isPlaying,
    currentTime: data.currentTime,
    updatedAt: Date.now(),
  })

  socket.to(data.roomId).emit(SOCKET_EVENTS.PLAYBACK_UPDATE, {
    isPlaying: data.isPlaying,
    currentTime: data.currentTime,
  })
}

export const registerPlaybackHandlers = (io: Server, socket: Socket): void => {
  socket.on(SOCKET_EVENTS.PLAYBACK_SYNC, (data: PlaybackSyncPayload) =>
    handlePlaybackSync(io, socket, data)
  )
}
