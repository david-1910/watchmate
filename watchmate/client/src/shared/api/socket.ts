import { io, Socket } from 'socket.io-client'
import { SOCKET_URL } from '../config'

type SocketAuth = Record<string, unknown>

let socket: Socket | null = null
let authProvider: (() => SocketAuth) | null = null

// Данные auth читаются при каждом (пере)подключении — всегда актуальный токен
export const setSocketAuth = (provider: (() => SocketAuth) | null): void => {
  authProvider = provider
}

// Синглтон без автоподключения: слушатели можно вешать заранее,
// соединение открывает только тот, кто задал auth и вызвал connect()
export const connectSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      auth: (cb) => cb(authProvider?.() ?? {}),
    })
  }
  return socket
}

// Объект сокета сохраняется, чтобы не терять подписки useSocketEvent
export const disconnectSocket = (): void => {
  socket?.disconnect()
}
