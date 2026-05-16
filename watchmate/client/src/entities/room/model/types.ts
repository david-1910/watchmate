export type Room = {
  id: string
  createdAt: string
  isPrivate: boolean
}

export type CreateRoomResult = {
  id: string
  hostToken: string
  isPrivate: boolean
}
