const API_HOST = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export const API_BASE_URL = `${API_HOST}/api/v1`
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3001'
