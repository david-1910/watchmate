import { state } from '../state/state'
import { env } from '../../shared/config/env'
import { roomEvents } from '../../shared/utils/roomEvents'
import { scheduleTimer, cancelTimer, cancelTimersByPrefix } from '../../shared/utils/timers'
import { generateId, generateJoinCode, generateSecretToken } from '../../shared/utils/generators'
import { Room } from '../../shared/types'

type CreateRoomParams = { isPrivate: boolean; password?: string }
type CreateRoomResult = { id: string; joinCode: string; hostToken: string; isPrivate: boolean }

const emptyTimerKey = (roomId: string) => `${roomId}:empty`

// Код вводится вручную: верхний регистр, без дефисов и пробелов
const normalizeJoinCode = (code: string): string => code.toUpperCase().replace(/[-\s]/g, '')

const generateUniqueJoinCode = (): string => {
  let code = generateJoinCode()
  while (state.roomIdsByCode.has(code)) code = generateJoinCode()
  return code
}

const deleteRoom = (roomId: string): void => {
  if (!state.rooms.has(roomId)) return
  roomEvents.emit('room-deleted', roomId)
  cancelTimersByPrefix(`${roomId}:`)
  state.deleteRoom(roomId)
  console.log(`Комната ${roomId} удалена`)
}

// Комната без онлайн-участников удаляется через ROOM_EMPTY_TTL_MS
const scheduleEmptyRoomDeletion = (roomId: string): void =>
  scheduleTimer(emptyTimerKey(roomId), env.roomEmptyTtlMs, () => deleteRoom(roomId))

const cancelEmptyRoomDeletion = (roomId: string): void => cancelTimer(emptyTimerKey(roomId))

const create = ({ isPrivate, password }: CreateRoomParams): CreateRoomResult => {
  const room: Room = {
    id: generateId(),
    joinCode: generateUniqueJoinCode(),
    createdAt: new Date(),
    hostToken: generateSecretToken(),
    isPrivate,
    password: isPrivate ? password : undefined,
  }
  state.rooms.set(room.id, room)
  state.roomIdsByCode.set(room.joinCode, room.id)
  // Пока никто не подключился, комната пустая
  scheduleEmptyRoomDeletion(room.id)
  console.log(`Комната создана: ${room.id} (${isPrivate ? 'приватная' : 'публичная'})`)
  return { id: room.id, joinCode: room.joinCode, hostToken: room.hostToken, isPrivate }
}

const findById = (roomId: string): Room | undefined => state.rooms.get(roomId)

const findByCode = (code: string): Room | undefined => {
  const roomId = state.roomIdsByCode.get(normalizeJoinCode(code))
  return roomId ? findById(roomId) : undefined
}

// Новый код; старый перестаёт работать сразу
const regenerateJoinCode = (room: Room): string => {
  state.roomIdsByCode.delete(room.joinCode)
  room.joinCode = generateUniqueJoinCode()
  state.roomIdsByCode.set(room.joinCode, room.id)
  return room.joinCode
}

const checkPassword = (room: Room, password?: string): boolean => !room.isPrivate || room.password === password

const isHostToken = (room: Room, hostToken?: string): boolean => !!hostToken && room.hostToken === hostToken

export const roomsService = {
  create,
  findById,
  findByCode,
  regenerateJoinCode,
  checkPassword,
  isHostToken,
  scheduleEmptyRoomDeletion,
  cancelEmptyRoomDeletion,
}
