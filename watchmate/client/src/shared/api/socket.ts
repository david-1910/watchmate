import { io, Socket } from 'socket.io-client'
import { SOCKET_URL } from '../config'

let socket: Socket | null = null

export const connectSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL)
  }
  return socket
}

export const getSocket = (): Socket | null => socket

export const disconnectSocket = (): void => {
  socket?.disconnect()
  socket = null
}
