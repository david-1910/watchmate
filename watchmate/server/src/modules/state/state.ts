import { Room, Member, QueueItem, Suggestion, ChatLog, StoredPlayback, PendingRequest } from '../../shared/types'

type MemberRef = { roomId: string; userId: string }

const rooms = new Map<string, Room>()
const roomIdsByCode = new Map<string, string>()
const members = new Map<string, Map<string, Member>>()
const memberTokens = new Map<string, MemberRef>()
const roomHosts = new Map<string, string>()
const readyUsers = new Map<string, Set<string>>()
const activeCountdowns = new Set<string>()
const roomQueues = new Map<string, QueueItem[]>()
// roomId → (requestId → запрос зрителя, ждущий ответа хоста)
const roomRequests = new Map<string, Map<string, PendingRequest>>()
const roomSuggestions = new Map<string, Suggestion[]>()
const roomMessages = new Map<string, ChatLog>()
const roomCurrentVideo = new Map<string, string>()
const roomPlayback = new Map<string, StoredPlayback>()

// Участники комнаты в порядке входа
const getMembers = (roomId: string): Member[] =>
  [...(members.get(roomId)?.values() ?? [])].sort((a, b) => a.joinedAt - b.joinedAt)

const getOnlineMembers = (roomId: string): Member[] => getMembers(roomId).filter((m) => m.sockets > 0)

const getMember = (roomId: string, userId: string): Member | undefined => members.get(roomId)?.get(userId)

const addMember = (roomId: string, member: Member): void => {
  const roomMembers = members.get(roomId) ?? new Map<string, Member>()
  roomMembers.set(member.userId, member)
  members.set(roomId, roomMembers)
  memberTokens.set(member.token, { roomId, userId: member.userId })
}

const deleteMember = (roomId: string, userId: string): void => {
  const member = getMember(roomId, userId)
  if (!member) return
  memberTokens.delete(member.token)
  members.get(roomId)?.delete(userId)
}

// Удаляет комнату со всеми её данными, включая токены участников
const deleteRoom = (roomId: string): void => {
  const room = rooms.get(roomId)
  if (room) roomIdsByCode.delete(room.joinCode)
  getMembers(roomId).forEach((m) => memberTokens.delete(m.token))
  rooms.delete(roomId)
  members.delete(roomId)
  roomHosts.delete(roomId)
  readyUsers.delete(roomId)
  activeCountdowns.delete(roomId)
  roomQueues.delete(roomId)
  roomSuggestions.delete(roomId)
  roomMessages.delete(roomId)
  roomCurrentVideo.delete(roomId)
  roomPlayback.delete(roomId)
  roomRequests.delete(roomId)
}

export const state = {
  rooms,
  roomIdsByCode,
  memberTokens,
  roomHosts,
  readyUsers,
  activeCountdowns,
  roomQueues,
  roomSuggestions,
  roomMessages,
  roomCurrentVideo,
  roomPlayback,
  roomRequests,
  getMembers,
  getOnlineMembers,
  getMember,
  addMember,
  deleteMember,
  deleteRoom,
}
