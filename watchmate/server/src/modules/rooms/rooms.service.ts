import { state } from '../state/state'
import { generateRoomId, generateHostToken } from '../../shared/utils/generators'
import { Room } from '../../shared/types'

type CreateRoomParams = {
  isPrivate: boolean
  password?: string
}

type CreateRoomResult = {
  id: string
  hostToken: string
  isPrivate: boolean
}

const create = (params: CreateRoomParams): CreateRoomResult => {
  const id = generateRoomId()
  const hostToken = generateHostToken()

  const room: Room = {
    id,
    createdAt: new Date(),
    hostToken,
    isPrivate: params.isPrivate,
    password: params.isPrivate ? params.password : undefined,
  }

  state.rooms.set(id, room)
  console.log(`Комната создана: ${id} (${params.isPrivate ? 'приватная' : 'публичная'})`)

  return { id, hostToken, isPrivate: params.isPrivate }
}

const findById = (id: string): Room | undefined =>
  state.rooms.get(id.toUpperCase())

const verifyPassword = (id: string, password: string): boolean => {
  const room = findById(id)
  if (!room) return false
  if (!room.isPrivate) return true
  return room.password === password
}

export const roomsService = { create, findById, verifyPassword }
