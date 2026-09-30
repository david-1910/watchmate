// Типы строго по CONTRACT.md, раздел 4 (состояние комнаты) и раздел 5 (ответы REST)

export type RoomUser = {
  userId: string
  userName: string
  online: boolean
}

export type QueueItem = { id: string; url: string; title: string }

export type Suggestion = {
  id: string
  url: string
  title: string
  suggestedBy: string
  suggestedById: string
}

export type PlaybackState = { isPlaying: boolean; currentTime: number }

export type ReadyState = { readyUsers: string[]; allReady: boolean }

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

// GET /rooms/:roomId и GET /rooms/by-code/:code
export type RoomInfo = { id: string; isPrivate: boolean }

// POST /rooms
export type CreateRoomBody = { isPrivate?: boolean; password?: string }
export type CreateRoomResult = {
  id: string
  joinCode: string
  hostToken: string
  isPrivate: boolean
}

// POST /rooms/:roomId/members
export type JoinRoomBody = {
  userName: string
  password?: string
  hostToken?: string
}
export type JoinRoomResult = {
  userId: string
  memberToken: string
  isHost: boolean
}

// Ответы команд с broadcast
export type PlayedResult = { video: string; queue: QueueItem[] }
export type AcceptSuggestionResult = {
  queue: QueueItem[]
  suggestions: Suggestion[]
}

// session-ended
export type SessionEndReason = 'room-deleted' | 'member-removed'
