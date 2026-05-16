import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import swaggerUi from 'swagger-ui-express'
import { env } from './shared/config/env'
import { swaggerSpec } from './shared/config/swagger'
import { roomsRouter } from './modules/rooms/rooms.router'
import { roomUsersRouter } from './modules/rooms/rooms.users.router'
import { createQueueRouter } from './modules/queue/queue.router'
import { createSuggestionsRouter } from './modules/suggestions/suggestions.router'
import { createSocketGateway } from './modules/socket/socket.gateway'
import { notFoundHandler, errorHandler } from './shared/middleware/errorHandler'

const app = express()

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}
app.options('*', cors(corsOptions))
app.use(cors(corsOptions))
app.use(express.json())

app.use('/api/docs', swaggerUi.serve)
app.get('/api/docs', swaggerUi.setup(swaggerSpec))

const httpServer = createServer(app)
const io = createSocketGateway(httpServer)

const api = express.Router()
api.use('/rooms', roomsRouter)
api.use('/rooms/:roomId/users', roomUsersRouter)
api.use('/rooms/:roomId/queue', createQueueRouter(io))
api.use('/rooms/:roomId/suggestions', createSuggestionsRouter(io))

app.use('/api/v1', api)

app.use(notFoundHandler)
app.use(errorHandler)

export { httpServer }
