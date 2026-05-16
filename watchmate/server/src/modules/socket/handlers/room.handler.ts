import { Server, Socket } from 'socket.io'
import { state } from '../../state/state'
import { SOCKET_EVENTS } from '../../../shared/constants/socketEvents'

type JoinRoomPayload = {
  roomId: string
  userName: string
  hostToken?: string
}

const handleJoinRoom = (io: Server, socket: Socket, data: JoinRoomPayload): void => {
  const { roomId, userName, hostToken } = data
  if (!roomId || !userName?.trim()) return

  socket.join(roomId)
  state.userNames.set(socket.id, userName.trim())
  state.userRooms.set(socket.id, roomId)
  console.log(`${userName} вошёл в комнату ${roomId}`)

  const room = state.rooms.get(roomId)
  const isCreator = hostToken && room?.hostToken === hostToken

  if (isCreator) {
    state.roomHosts.set(roomId, socket.id)
    console.log(`${userName} — хост ${roomId} (создатель)`)
  } else if (!state.roomHosts.has(roomId)) {
    state.roomHosts.set(roomId, socket.id)
    console.log(`${userName} — хост ${roomId} (первый)`)
  }

  io.to(roomId).emit(SOCKET_EVENTS.USERS_UPDATE, state.getRoomUsers(roomId))
  io.to(roomId).emit(SOCKET_EVENTS.HOST_UPDATE, state.roomHosts.get(roomId))
  socket.to(roomId).emit(SOCKET_EVENTS.USER_JOINED, { userId: socket.id, userName })

  const history = state.roomMessages.get(roomId) ?? []
  if (history.length > 0) socket.emit(SOCKET_EVENTS.CHAT_HISTORY, history)

  const currentVideo = state.roomCurrentVideo.get(roomId)
  if (currentVideo) socket.emit(SOCKET_EVENTS.VIDEO_UPDATE, currentVideo)

  const queue = state.roomQueues.get(roomId) ?? []
  if (queue.length > 0) socket.emit(SOCKET_EVENTS.QUEUE_UPDATE, queue)

  const suggestions = state.roomSuggestions.get(roomId) ?? []
  if (suggestions.length > 0) socket.emit(SOCKET_EVENTS.SUGGESTIONS_UPDATE, suggestions)

  const readyUsersList = state.getRoomReadyUsers(roomId)
  if (readyUsersList.length > 0) {
    socket.emit(SOCKET_EVENTS.READY_UPDATE, { readyUsers: readyUsersList, allReady: false })
  }

  const playback = state.roomPlayback.get(roomId)
  if (playback) {
    const elapsed = playback.isPlaying ? (Date.now() - playback.updatedAt) / 1000 : 0
    socket.emit(SOCKET_EVENTS.PLAYBACK_UPDATE, {
      isPlaying: playback.isPlaying,
      currentTime: playback.currentTime + elapsed,
    })
  }
}

const handleDisconnect = (io: Server, socket: Socket): void => {
  const userName = state.userNames.get(socket.id)
  const roomId = state.userRooms.get(socket.id)
  console.log(`${userName ?? socket.id} отключился`)

  state.userNames.delete(socket.id)
  state.userRooms.delete(socket.id)

  if (!roomId) return

  state.readyUsers.get(roomId)?.delete(socket.id)
  io.to(roomId).emit(SOCKET_EVENTS.READY_UPDATE, {
    readyUsers: state.getRoomReadyUsers(roomId),
    allReady: false,
  })

  if (state.roomHosts.get(roomId) === socket.id) {
    const remaining = state.getRoomUsers(roomId)
    if (remaining.length > 0) {
      state.roomHosts.set(roomId, remaining[0].userId)
      io.to(roomId).emit(SOCKET_EVENTS.HOST_UPDATE, remaining[0].userId)
      console.log(`Новый хост: ${remaining[0].userName}`)
    } else {
      state.roomHosts.delete(roomId)
    }
  }

  const remainingUsers = state.getRoomUsers(roomId)
  io.to(roomId).emit(SOCKET_EVENTS.USERS_UPDATE, remainingUsers)

  if (remainingUsers.length === 0) {
    state.cleanupRoom(roomId)
    console.log(`Комната ${roomId} удалена`)
  }
}

export const registerRoomHandlers = (io: Server, socket: Socket): void => {
  socket.on(SOCKET_EVENTS.JOIN_ROOM, (data: JoinRoomPayload) => handleJoinRoom(io, socket, data))
  socket.on('disconnect', () => handleDisconnect(io, socket))
}
