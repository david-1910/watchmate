import { Server, Socket } from 'socket.io'
import { state } from '../../state/state'
import { SOCKET_EVENTS } from '../../../shared/constants/socketEvents'
import { generateId } from '../../../shared/utils/generators'

const isHost = (socket: Socket, roomId: string): boolean =>
  state.roomHosts.get(roomId) === socket.id &&
  state.userRooms.get(socket.id) === roomId

const getQueue = (roomId: string) => state.roomQueues.get(roomId) ?? []

const handleQueueAdd = (
  io: Server,
  socket: Socket,
  data: { roomId: string; url: string; title: string }
): void => {
  if (!isHost(socket, data.roomId) || !data.url?.trim()) return
  const queue = [...getQueue(data.roomId), { id: generateId(), url: data.url, title: data.title || data.url }]
  state.roomQueues.set(data.roomId, queue)
  io.to(data.roomId).emit(SOCKET_EVENTS.QUEUE_UPDATE, queue)
}

const handleQueueRemove = (
  io: Server,
  socket: Socket,
  data: { roomId: string; itemId: string }
): void => {
  if (!isHost(socket, data.roomId)) return
  const queue = getQueue(data.roomId).filter((item) => item.id !== data.itemId)
  state.roomQueues.set(data.roomId, queue)
  io.to(data.roomId).emit(SOCKET_EVENTS.QUEUE_UPDATE, queue)
}

const handleQueuePlay = (
  io: Server,
  socket: Socket,
  data: { roomId: string; itemId: string }
): void => {
  if (!isHost(socket, data.roomId)) return
  const queue = getQueue(data.roomId)
  const item = queue.find((i) => i.id === data.itemId)
  if (!item) return
  const filtered = queue.filter((i) => i.id !== data.itemId)
  state.roomQueues.set(data.roomId, filtered)
  io.to(data.roomId).emit(SOCKET_EVENTS.QUEUE_UPDATE, filtered)
  io.to(data.roomId).emit(SOCKET_EVENTS.VIDEO_UPDATE, item.url)
}

const handleQueueReorder = (
  io: Server,
  socket: Socket,
  data: { roomId: string; fromIndex: number; toIndex: number }
): void => {
  if (!isHost(socket, data.roomId)) return
  const queue = [...getQueue(data.roomId)]
  const { fromIndex, toIndex } = data
  if (
    fromIndex < 0 || fromIndex >= queue.length ||
    toIndex < 0 || toIndex >= queue.length ||
    fromIndex === toIndex
  ) return
  const [moved] = queue.splice(fromIndex, 1)
  queue.splice(toIndex, 0, moved)
  state.roomQueues.set(data.roomId, queue)
  io.to(data.roomId).emit(SOCKET_EVENTS.QUEUE_UPDATE, queue)
}

const handleQueueNext = (
  io: Server,
  socket: Socket,
  data: { roomId: string }
): void => {
  if (!isHost(socket, data.roomId)) return
  const queue = getQueue(data.roomId)
  if (queue.length === 0) return
  const [next, ...rest] = queue
  state.roomQueues.set(data.roomId, rest)
  io.to(data.roomId).emit(SOCKET_EVENTS.QUEUE_UPDATE, rest)
  io.to(data.roomId).emit(SOCKET_EVENTS.VIDEO_UPDATE, next.url)
}

export const registerQueueHandlers = (io: Server, socket: Socket): void => {
  socket.on(SOCKET_EVENTS.QUEUE_ADD, (data) => handleQueueAdd(io, socket, data))
  socket.on(SOCKET_EVENTS.QUEUE_REMOVE, (data) => handleQueueRemove(io, socket, data))
  socket.on(SOCKET_EVENTS.QUEUE_PLAY, (data) => handleQueuePlay(io, socket, data))
  socket.on(SOCKET_EVENTS.QUEUE_REORDER, (data) => handleQueueReorder(io, socket, data))
  socket.on(SOCKET_EVENTS.QUEUE_NEXT, (data) => handleQueueNext(io, socket, data))
}
