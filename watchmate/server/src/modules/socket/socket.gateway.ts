import { Server as HttpServer } from 'http'
import { Server } from 'socket.io'
import { membersService } from '../members/members.service'
import { subscribeRoomEvents } from './socket.broadcaster'
import { AppServer, AppSocket } from './socket.types'
import { registerPresenceHandlers } from './handlers/presence.handler'
import { registerPlaybackHandlers } from './handlers/playback.handler'
import { registerReactionsHandlers } from './handlers/reactions.handler'
import { registerRequestHandlers } from './handlers/request.handler'
import { env } from '../../shared/config/env'
import { SOCKET_EVENTS_PER_SECOND } from '../../shared/constants/limits'
import { isObject, isRoomId } from '../../shared/utils/validators'

const MAX_CONNECTIONS_PER_IP = 10

const HANDLERS = [
  registerPresenceHandlers,
  registerPlaybackHandlers,
  registerReactionsHandlers,
  registerRequestHandlers,
]

type Middleware = (socket: AppSocket, next: (err?: Error) => void) => void

// За прокси (TRUST_PROXY=1) берём последний адрес X-Forwarded-For — его добавил наш прокси
const getClientIp = (socket: AppSocket): string => {
  const forwarded = socket.handshake.headers['x-forwarded-for']
  if (!env.trustProxy || typeof forwarded !== 'string') return socket.handshake.address
  return forwarded.split(',').pop()?.trim() || socket.handshake.address
}

// auth { roomId, memberToken } → socket.data
const authenticate: Middleware = (socket, next) => {
  const auth: unknown = socket.handshake.auth
  const roomId = isObject(auth) ? auth.roomId : undefined
  const memberToken = isObject(auth) ? auth.memberToken : undefined
  if (!isRoomId(roomId) || typeof memberToken !== 'string') return next(new Error('UNAUTHORIZED'))
  const member = membersService.authenticate(roomId, memberToken)
  if (!member) return next(new Error('UNAUTHORIZED'))
  socket.data = { roomId, userId: member.userId }
  next()
}

// Лимит одновременных подключений с одного IP. Последний в цепочке io.use:
// счётчик растёт только у сокетов, которые точно подключатся
const createIpConnectionLimiter = (): Middleware => {
  const ipConnections = new Map<string, number>()

  return (socket, next) => {
    const ip = getClientIp(socket)
    const current = ipConnections.get(ip) ?? 0
    if (current >= MAX_CONNECTIONS_PER_IP) {
      console.warn(`Лимит подключений превышен для IP ${ip}`)
      return next(new Error('RATE_LIMIT'))
    }
    ipConnections.set(ip, current + 1)
    socket.on('disconnect', () => {
      const n = ipConnections.get(ip) ?? 1
      if (n <= 1) ipConnections.delete(ip)
      else ipConnections.set(ip, n - 1)
    })
    next()
  }
}

// Больше SOCKET_EVENTS_PER_SECOND событий в секунду — лишние отбрасываются, сокет не отключается
const dropFloodEvents = (socket: AppSocket): void => {
  let windowStart = Date.now()
  let count = 0
  socket.use((_packet, next) => {
    const now = Date.now()
    if (now - windowStart >= 1000) {
      windowStart = now
      count = 0
    }
    count += 1
    if (count <= SOCKET_EVENTS_PER_SECOND) next()
  })
}

export const createSocketGateway = (httpServer: HttpServer): AppServer => {
  const io: AppServer = new Server(httpServer, {
    cors: { origin: true, credentials: true, methods: ['GET', 'POST'] },
    maxHttpBufferSize: 1e5, // 100 KB
    pingTimeout: 30000,
    pingInterval: 25000,
  })

  io.use(authenticate)
  io.use(createIpConnectionLimiter())
  subscribeRoomEvents(io)

  io.on('connection', (socket) => {
    dropFloodEvents(socket)
    HANDLERS.forEach((register) => register(io, socket))
  })

  return io
}
