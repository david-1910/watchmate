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

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin ?? '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  next()
})
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
