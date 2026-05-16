import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { roomsRouter } from './modules/rooms/rooms.router'
import { createSocketGateway } from './modules/socket/socket.gateway'

const app = express()
app.use(cors())
app.use(express.json())
app.use('/rooms', roomsRouter)

const httpServer = createServer(app)
createSocketGateway(httpServer)

export { httpServer }
