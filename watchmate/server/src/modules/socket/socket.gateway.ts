import { Server as HttpServer } from 'http'
import { Server, Socket } from 'socket.io'
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

// Простой rate limiter для socket событий
const socketRateLimiter = (socket: Socket, limitPerSecond = 10) => {
  let count = 0
  let blocked = false

  const reset = setInterval(() => { count = 0 }, 1000)
  socket.on('disconnect', () => clearInterval(reset))

  return () => {
    count++
    if (count > limitPerSecond && !blocked) {
      blocked = true
      console.warn(`Socket flood от ${socket.id} — отключаем`)
      socket.disconnect(true)
    }
  }
}

export const createSocketGateway = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: { origin: true, credentials: true, methods: ['GET', 'POST'] },
    // Ограничение размера пакета
    maxHttpBufferSize: 1e5, // 100 KB
    pingTimeout: 30000,
    pingInterval: 25000,
  })

  // Лимит одновременных подключений с одного IP (защита от DDoS ботов)
  const ipConnections = new Map<string, number>()
  const MAX_CONNECTIONS_PER_IP = 10

  io.on('connection', (socket) => {
    const ip = socket.handshake.address

    const current = ipConnections.get(ip) ?? 0
    if (current >= MAX_CONNECTIONS_PER_IP) {
      console.warn(`Лимит подключений превышен для IP ${ip}`)
      socket.disconnect(true)
      return
    }
    ipConnections.set(ip, current + 1)
    socket.on('disconnect', () => {
      const n = ipConnections.get(ip) ?? 1
      if (n <= 1) ipConnections.delete(ip)
      else ipConnections.set(ip, n - 1)
    })

    const checkRate = socketRateLimiter(socket, 15)
    socket.onAny(() => checkRate())

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
