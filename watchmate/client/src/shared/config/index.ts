export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3001'

export const REACTION_EMOJIS = ['👍', '👎', '😁', '😒', '🔥', '❤️', '😍', '🤦‍♂️'] as const

export const AVATAR_COLORS = [
  'bg-purple-500/40',
  'bg-blue-500/40',
  'bg-green-500/40',
  'bg-pink-500/40',
  'bg-orange-500/40',
  'bg-cyan-500/40',
  'bg-red-500/40',
  'bg-indigo-500/40',
] as const

export const COUNTDOWN_START = 3
export const COUNTDOWN_INTERVAL_MS = 1000
export const REACTION_LIFETIME_MS = 1700
export const REACTION_LEFT_MIN = 15
export const REACTION_LEFT_RANGE = 70
export const REACTION_DURATION_BASE = 1.2
export const REACTION_DURATION_VARIANCE = 0.2

export { SOCKET_EVENTS } from './socketEvents'
