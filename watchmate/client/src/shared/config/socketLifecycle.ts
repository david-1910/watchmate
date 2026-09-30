// Зарезервированные события Socket.IO (не часть протокола, поэтому не в SOCKET_EVENTS)
export const SOCKET_LIFECYCLE = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
} as const

// Причина disconnect, после которой Socket.IO сам не переподключается
export const SERVER_DISCONNECT_REASON = 'io server disconnect'
