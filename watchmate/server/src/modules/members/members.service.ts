import { state } from '../state/state'
import { roomsService } from '../rooms/rooms.service'
import { readyService } from '../ready/ready.service'
import { hostService } from './host.service'
import { env } from '../../shared/config/env'
import { roomEvents } from '../../shared/utils/roomEvents'
import { scheduleTimer, cancelTimer } from '../../shared/utils/timers'
import { generateId, generateSecretToken } from '../../shared/utils/generators'
import { Member, Room, RoomUser } from '../../shared/types'

type JoinParams = { userName: string; password?: string; hostToken?: string }
type JoinResult = { userId: string; memberToken: string; isHost: boolean }

const memberTimerKey = (roomId: string, userId: string) => `${roomId}:member:${userId}`

const hasOnlineMembers = (roomId: string): boolean => state.getOnlineMembers(roomId).length > 0

const removeMember = (roomId: string, userId: string): void => {
  if (!state.getMember(roomId, userId)) return
  const wasHost = hostService.isHost(roomId, userId)
  cancelTimer(memberTimerKey(roomId, userId))
  state.deleteMember(roomId, userId)
  roomEvents.emit('member-removed', roomId, userId)
  if (wasHost) hostService.handOver(roomId)
  if (readyService.remove(roomId, userId)) roomEvents.emit('ready-changed', roomId)
  roomEvents.emit('users-changed', roomId)
  console.log(`Участник ${userId} удалён из комнаты ${roomId}`)
}

// Участник без живого сокета удаляется через MEMBER_GRACE_MS
const scheduleRemoval = (roomId: string, userId: string): void =>
  scheduleTimer(memberTimerKey(roomId, userId), env.memberGraceMs, () => removeMember(roomId, userId))

// null — неверный пароль. Верный hostToken пропускает проверку пароля
const join = (room: Room, { userName, password, hostToken }: JoinParams): JoinResult | null => {
  const hasHostToken = roomsService.isHostToken(room, hostToken)
  if (!hasHostToken && !roomsService.checkPassword(room, password)) return null

  const member: Member = {
    userId: generateId(),
    userName: userName.trim(),
    token: generateSecretToken(),
    joinedAt: Date.now(),
    sockets: 0,
  }
  state.addMember(room.id, member)
  scheduleRemoval(room.id, member.userId)

  // hostToken даёт роль, только если хоста нет или он офлайн
  if (hasHostToken && !hostService.isHostOnline(room.id)) {
    hostService.setHost(room.id, member.userId)
    hostService.scheduleHandOver(room.id)
  }

  return { userId: member.userId, memberToken: member.token, isHost: hostService.isHost(room.id, member.userId) }
}

// Выход по запросу: участник удаляется сразу, роль хоста передаётся сразу
const leave = (roomId: string, userId: string): void => {
  removeMember(roomId, userId)
  if (!hasOnlineMembers(roomId)) roomsService.scheduleEmptyRoomDeletion(roomId)
}

const authenticate = (roomId: string, memberToken: string): Member | undefined => {
  const ref = state.memberTokens.get(memberToken)
  return ref?.roomId === roomId ? state.getMember(roomId, ref.userId) : undefined
}

const getMember = (roomId: string, userId: string): Member | undefined => state.getMember(roomId, userId)

// Новый сокет участника. Первый сокет делает его онлайн и отменяет таймеры
const connect = (roomId: string, userId: string): void => {
  const member = state.getMember(roomId, userId)
  if (!member) return
  member.sockets += 1

  if (member.sockets === 1) {
    cancelTimer(memberTimerKey(roomId, userId))
    roomsService.cancelEmptyRoomDeletion(roomId)
    if (hostService.isHost(roomId, userId)) hostService.cancelHandOver(roomId)
    // Хоста нет — роль получает первый вернувшийся онлайн
    else if (hostService.getHostId(roomId) === null) hostService.setHost(roomId, userId)
  }
  roomEvents.emit('users-changed', roomId)
  // allReady считается по онлайн-зрителям — пересчитываем при смене статуса
  if (member.sockets === 1) roomEvents.emit('ready-changed', roomId)
}

// Участник офлайн, только когда закрыт последний его сокет
const disconnect = (roomId: string, userId: string): void => {
  const member = state.getMember(roomId, userId)
  if (!member || member.sockets === 0) return
  member.sockets -= 1
  if (member.sockets > 0) return

  scheduleRemoval(roomId, userId)
  if (hostService.isHost(roomId, userId)) hostService.scheduleHandOver(roomId)
  if (!hasOnlineMembers(roomId)) roomsService.scheduleEmptyRoomDeletion(roomId)
  roomEvents.emit('users-changed', roomId)
  roomEvents.emit('ready-changed', roomId)
}

// Хост первым, остальные в порядке входа
const getUsers = (roomId: string): RoomUser[] => {
  const hostId = hostService.getHostId(roomId)
  const users = state.getMembers(roomId).map((m) => ({ userId: m.userId, userName: m.userName, online: m.sockets > 0 }))
  return [...users.filter((u) => u.userId === hostId), ...users.filter((u) => u.userId !== hostId)]
}

export const membersService = { join, leave, authenticate, getMember, connect, disconnect, getUsers }
