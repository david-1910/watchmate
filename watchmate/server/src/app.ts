import express from 'express'
import { createServer } from 'http'
import swaggerUi from 'swagger-ui-express'
import { env } from './shared/config/env'
import { swaggerSpec } from './shared/config/swagger'
import { cors } from './shared/middleware/cors'
import { globalLimiter } from './shared/middleware/rateLimit'
import { notFoundHandler, errorHandler } from './shared/middleware/errorHandler'
import { createSocketGateway } from './modules/socket/socket.gateway'
import { createRoomsRouter } from './modules/rooms/rooms.router'
import { membersRouter, hostRouter } from './modules/members/members.router'
import { snapshotRouter } from './modules/snapshot/snapshot.router'
import { createChatRouter } from './modules/chat/chat.router'
import { createVideoRouter } from './modules/playback/video.router'
import { createQueueRouter } from './modules/queue/queue.router'
import { createSuggestionsRouter } from './modules/suggestions/suggestions.router'
import { createReadyRouter } from './modules/ready/ready.router'

const app = express()

// За прокси req.ip (и лимиты запросов) берут IP клиента из X-Forwarded-For
app.set('trust proxy', env.trustProxy ? 1 : false)
app.use(cors)
app.use(express.json({ limit: '10kb' }))
app.use('/api/', globalLimiter)

app.use('/api/docs', swaggerUi.serve)
app.get('/api/docs', swaggerUi.setup(swaggerSpec))

const httpServer = createServer(app)
const io = createSocketGateway(httpServer)

const api = express.Router()
api.use('/rooms', createRoomsRouter(io))
api.use('/rooms/:roomId/members', membersRouter)
api.use('/rooms/:roomId/host', hostRouter)
api.use('/rooms/:roomId/state', snapshotRouter)
api.use('/rooms/:roomId/messages', createChatRouter(io))
api.use('/rooms/:roomId/video', createVideoRouter(io))
api.use('/rooms/:roomId/queue', createQueueRouter(io))
api.use('/rooms/:roomId/suggestions', createSuggestionsRouter(io))
api.use('/rooms/:roomId/ready', createReadyRouter(io))

app.use('/api/v1', api)

app.use(notFoundHandler)
app.use(errorHandler)

export { httpServer }
