import { Server, Socket } from 'socket.io'
import { state } from '../../state/state'
import { SOCKET_EVENTS } from '../../../shared/constants/socketEvents'
import { generateId } from '../../../shared/utils/generators'

const isHost = (socket: Socket, roomId: string): boolean =>
  state.roomHosts.get(roomId) === socket.id &&
  state.userRooms.get(socket.id) === roomId

const isInRoom = (socket: Socket, roomId: string): boolean =>
  state.userRooms.get(socket.id) === roomId

const getSuggestions = (roomId: string) => state.roomSuggestions.get(roomId) ?? []

const handleSuggestVideo = (
  io: Server,
  socket: Socket,
  data: { roomId: string; url: string; title: string }
): void => {
  if (!isInRoom(socket, data.roomId) || !data.url?.trim()) return
  const userName = state.userNames.get(socket.id) ?? 'Аноним'
  const suggestions = [
    ...getSuggestions(data.roomId),
    { id: generateId(), url: data.url, title: data.title || data.url, suggestedBy: userName, suggestedById: socket.id },
  ]
  state.roomSuggestions.set(data.roomId, suggestions)
  io.to(data.roomId).emit(SOCKET_EVENTS.SUGGESTIONS_UPDATE, suggestions)
}

const handleAcceptSuggestion = (
  io: Server,
  socket: Socket,
  data: { roomId: string; suggestionId: string }
): void => {
  if (!isHost(socket, data.roomId)) return
  const suggestions = getSuggestions(data.roomId)
  const suggestion = suggestions.find((s) => s.id === data.suggestionId)
  if (!suggestion) return

  const queue = [...(state.roomQueues.get(data.roomId) ?? []), {
    id: generateId(),
    url: suggestion.url,
    title: suggestion.title,
  }]
  state.roomQueues.set(data.roomId, queue)

  const filtered = suggestions.filter((s) => s.id !== data.suggestionId)
  state.roomSuggestions.set(data.roomId, filtered)

  io.to(data.roomId).emit(SOCKET_EVENTS.QUEUE_UPDATE, queue)
  io.to(data.roomId).emit(SOCKET_EVENTS.SUGGESTIONS_UPDATE, filtered)
}

const handleRejectSuggestion = (
  io: Server,
  socket: Socket,
  data: { roomId: string; suggestionId: string }
): void => {
  if (!isHost(socket, data.roomId)) return
  const filtered = getSuggestions(data.roomId).filter((s) => s.id !== data.suggestionId)
  state.roomSuggestions.set(data.roomId, filtered)
  io.to(data.roomId).emit(SOCKET_EVENTS.SUGGESTIONS_UPDATE, filtered)
}

export const registerSuggestionsHandlers = (io: Server, socket: Socket): void => {
  socket.on(SOCKET_EVENTS.SUGGEST_VIDEO, (data) => handleSuggestVideo(io, socket, data))
  socket.on(SOCKET_EVENTS.ACCEPT_SUGGESTION, (data) => handleAcceptSuggestion(io, socket, data))
  socket.on(SOCKET_EVENTS.REJECT_SUGGESTION, (data) => handleRejectSuggestion(io, socket, data))
}
