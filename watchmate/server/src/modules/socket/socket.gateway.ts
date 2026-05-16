import { Server as HttpServer } from 'http'
import { Server } from 'socket.io'
import { env } from '../../shared/config/env'
import { registerRoomHandlers } from './handlers/room.handler'
import { registerChatHandlers } from './handlers/chat.handler'
import { registerVideoHandlers } from './handlers/video.handler'
import { registerQueueHandlers } from './handlers/queue.handler'
import { registerSuggestionsHandlers } from './handlers/suggestions.handler'
import { registerReadyHandlers } from './handlers/ready.handler'
import { registerReactionsHandlers } from './handlers/reactions.handler'
import { registerCountdownHandlers } from './handlers/countdown.handler'
import { registerPlaybackHandlers } from './handlers/playback.handler'
import { registerRequestHandlers } from './handlers/request.handler'
import { registerTransferHandlers } from './handlers/transfer.handler'

export const createSocketGateway = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: { origin: env.clientUrl, methods: ['GET', 'POST'] },
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
    registerPlaybackHandlers(io, socket)
    registerRequestHandlers(io, socket)
    registerTransferHandlers(io, socket)
  })

  return io
}
