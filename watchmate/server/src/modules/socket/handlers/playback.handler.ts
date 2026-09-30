import { playbackService } from '../../playback/playback.service'
import { isHost, onEvent } from '../socket.guards'
import { AppServer, AppSocket } from '../socket.types'
import { SOCKET_EVENTS } from '../../../shared/constants/socketEvents'
import { isObject } from '../../../shared/utils/validators'
import { PlaybackState } from '../../../shared/types'

const parsePlaybackSync = (raw: unknown): PlaybackState | null => {
  if (!isObject(raw) || typeof raw.isPlaying !== 'boolean') return null
  const { currentTime } = raw
  if (typeof currentTime !== 'number' || !Number.isFinite(currentTime) || currentTime < 0) return null
  return { isPlaying: raw.isPlaying, currentTime }
}

const handlePlaybackSync = (socket: AppSocket, playback: PlaybackState): void => {
  if (!isHost(socket)) return
  playbackService.savePosition(socket.data.roomId, playback)
  socket.to(socket.data.roomId).emit(SOCKET_EVENTS.PLAYBACK_UPDATE, playback)
}

export const registerPlaybackHandlers = (_io: AppServer, socket: AppSocket): void => {
  onEvent(socket, SOCKET_EVENTS.PLAYBACK_SYNC, parsePlaybackSync, (data) => handlePlaybackSync(socket, data))
}
