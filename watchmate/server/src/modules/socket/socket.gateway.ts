import { Server as HttpServer } from 'http'
import { Server } from 'socket.io'
import { registerRoomHandlers } from './handlers/room.handler'
import { registerChatHandlers } from './handlers/chat.handler'
import { registerVideoHandlers } from './handlers/video.handler'
import { registerQueueHandlers } from './handlers/queue.handler'
import { registerSuggestionsHandlers } from './handlers/suggestions.handler'
import { registerReadyHandlers } from './handlers/ready.handler'
import { registerReactionsHandlers } from './handlers/reactions.handler'
import { registerCountdownHandlers } from './handlers/countdown.handler'

export const createSocketGateway = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  })

  io.on('connection', (socket) => {
    console.log('Пользователь подключился:', socket.id)
    registerRoomHandlers(io, socket)
    registerChatHandlers(io, socket)
    registerVideoHandlers(io, socket)
    registerQueueHandlers(io, socket)
    registerSuggestionsHandlers(io, socket)
    registerReadyHandlers(io, socket)
    registerReactionsHandlers(io, socket)
    registerCountdownHandlers(io, socket)
  })

  return io
}
