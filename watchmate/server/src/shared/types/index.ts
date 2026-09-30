// Типы контракта (CONTRACT.md, раздел 4)

export type RoomUser = {
  userId: string
  userName: string
  online: boolean
}

export type ChatMessage = {
  id: string
  clientId: string
  seq: number
  userId: string
  userName: string
  message: string
  timestamp: string
}

export type QueueItem = {
  id: string
  url: string
  title: string
}

export type Suggestion = {
  id: string
  url: string
  title: string
  suggestedBy: string
  suggestedById: string
}

export type PlaybackState = {
  isPlaying: boolean
  currentTime: number
}

export type ReadyState = {
  readyUsers: string[]
  allReady: boolean
}

export type RoomSnapshot = {
  room: { id: string; joinCode: string; isPrivate: boolean; createdAt: string }
  me: { userId: string }
  users: RoomUser[]
  hostId: string | null
  ready: ReadyState
  video: string
  playback: PlaybackState | null
  queue: QueueItem[]
  suggestions: Suggestion[]
  lastSeq: number
}

export type SessionEndReason = 'room-deleted' | 'member-removed'

// Внутренние типы хранилища

export type Room = {
  id: string
  joinCode: string
  createdAt: Date
  hostToken: string
  isPrivate: boolean
  password?: string
}

export type Member = {
  userId: string
  userName: string
  token: string
  joinedAt: number
  sockets: number
}

export type StoredPlayback = PlaybackState & { updatedAt: number }

export type ChatLog = {
  messages: ChatMessage[]
  lastSeq: number
}

// Конверт REST-ответов

export type ApiSuccess<T> = {
  success: true
  data: T
}

export type ApiError = {
  success: false
  error: {
    message: string
    code: string
  }
}
