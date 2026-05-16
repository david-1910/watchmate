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

export type RoomUser = {
  userId: string
  userName: string
}

export type Room = {
  id: string
  createdAt: Date
  hostToken: string
  isPrivate: boolean
  password?: string
}

export type ReadyUpdate = {
  readyUsers: string[]
  allReady: boolean
}
