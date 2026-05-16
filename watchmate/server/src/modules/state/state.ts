import { Room, QueueItem, Suggestion, RoomUser } from '../../shared/types'

type PlaybackState = { isPlaying: boolean; currentTime: number; updatedAt: number }

const MAX_MESSAGES = 100

const rooms = new Map<string, Room>()
const userNames = new Map<string, string>()
const userRooms = new Map<string, string>()
const readyUsers = new Map<string, Set<string>>()
const roomHosts = new Map<string, string>()
const roomQueues = new Map<string, QueueItem[]>()
const roomSuggestions = new Map<string, Suggestion[]>()
const roomMessages = new Map<string, object[]>()
const roomCurrentVideo = new Map<string, string>()
const roomPlayback = new Map<string, PlaybackState>()

const getRoomUsers = (roomId: string): RoomUser[] => {
  const hostId = roomHosts.get(roomId)
  const users: RoomUser[] = []

  userRooms.forEach((room, userId) => {
    if (room === roomId) {
      users.push({ userId, userName: userNames.get(userId) ?? 'Аноним' })
    }
  })

  return users.sort((a, b) => {
    if (a.userId === hostId) return -1
    if (b.userId === hostId) return 1
    return 0
  })
}

const getRoomReadyUsers = (roomId: string): string[] =>
  Array.from(readyUsers.get(roomId) ?? [])

const cleanupRoom = (roomId: string): void => {
  rooms.delete(roomId)
  roomHosts.delete(roomId)
  readyUsers.delete(roomId)
  roomQueues.delete(roomId)
  roomSuggestions.delete(roomId)
  roomMessages.delete(roomId)
  roomCurrentVideo.delete(roomId)
  roomPlayback.delete(roomId)
}

const addMessage = (roomId: string, message: object): void => {
  const msgs = roomMessages.get(roomId) ?? []
  msgs.push(message)
  if (msgs.length > MAX_MESSAGES) msgs.shift()
  roomMessages.set(roomId, msgs)
}

export const state = {
  rooms,
  userNames,
  userRooms,
  readyUsers,
  roomHosts,
  roomQueues,
  roomSuggestions,
  roomMessages,
  roomCurrentVideo,
  roomPlayback,
  getRoomUsers,
  getRoomReadyUsers,
  cleanupRoom,
  addMessage,
}
