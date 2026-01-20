import { io, Socket } from 'socket.io-client'

const SOCKET_URL = 'http://localhost:3001'

let socket: Socket | null = null

export function connectSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL)
  }
  return socket
}

export function getSocket(): Socket | null {
  return socket
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
