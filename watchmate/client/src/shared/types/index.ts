export type Message = {
  userId: string
  userName: string
  message: string
  timestamp: Date
}

export type RoomUser = {
  userId: string
  userName: string
}

export type Reaction = {
  id: number
  userName: string
  emoji: string
  left: number
  direction: 'left' | 'right'
  duration: number
  zIndex: number
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

export type ReadyUpdate = {
  readyUsers: string[]
  allReady: boolean
}
