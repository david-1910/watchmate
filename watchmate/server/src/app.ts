import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
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

app.set('trust proxy', 1)

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin ?? '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  next()
})
app.use(express.json({ limit: '10kb' }))

// Общий лимит: 200 запросов за 15 минут с одного IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: 'Слишком много запросов', code: 'RATE_LIMIT' } },
})

// Создание комнат: 10 комнат в час (защита от спама памяти)
const createRoomLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, error: { message: 'Слишком много комнат создано', code: 'RATE_LIMIT' } },
})

// Проверка пароля: 5 попыток за 15 минут (защита от брутфорса)
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: { message: 'Слишком много попыток входа', code: 'RATE_LIMIT' } },
})

app.use('/api/', globalLimiter)

app.use('/api/docs', swaggerUi.serve)
app.get('/api/docs', swaggerUi.setup(swaggerSpec))

const httpServer = createServer(app)
const io = createSocketGateway(httpServer)

const api = express.Router()
api.post('/rooms', createRoomLimiter, (req, res, next) => next())
api.post('/rooms/:roomId/verify', verifyLimiter, (req, res, next) => next())
api.use('/rooms', roomsRouter)
api.use('/rooms/:roomId/users', roomUsersRouter)
api.use('/rooms/:roomId/queue', createQueueRouter(io))
api.use('/rooms/:roomId/suggestions', createSuggestionsRouter(io))

app.use('/api/v1', api)

app.use(notFoundHandler)
app.use(errorHandler)

export { httpServer }
