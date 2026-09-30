import { http } from '@/shared/api'
import { memberClient } from './memberClient'
import type {
  RoomInfo,
  RoomSnapshot,
  CreateRoomBody,
  CreateRoomResult,
  JoinRoomBody,
  JoinRoomResult,
  ReadyState,
} from '../model/types'

const roomPath = (roomId: string) => `/rooms/${encodeURIComponent(roomId)}`

// public
export const createRoom = (body: CreateRoomBody) =>
  http.post<CreateRoomResult>('/rooms', body)

export const getRoom = (roomId: string) =>
  http.get<RoomInfo>(roomPath(roomId))

export const getRoomByCode = (code: string) =>
  http.get<RoomInfo>(`/rooms/by-code/${encodeURIComponent(code)}`)

export const joinRoom = (roomId: string, body: JoinRoomBody) =>
  http.post<JoinRoomResult>(`${roomPath(roomId)}/members`, body)

// member
export const leaveRoom = (roomId: string) =>
  memberClient(roomId).delete<{ left: true }>('/members/me')

export const getRoomState = (roomId: string) =>
  memberClient(roomId).get<RoomSnapshot>('/state')

export const toggleReady = (roomId: string) =>
  memberClient(roomId).post<ReadyState>('/ready/toggle')

// host: запуск отсчёта, когда все зрители готовы
export const startWatching = (roomId: string) =>
  memberClient(roomId).post<{ started: boolean }>('/ready/start')

// host
export const regenerateJoinCode = (roomId: string) =>
  memberClient(roomId).post<{ joinCode: string }>('/code')

export const transferHost = (roomId: string, userId: string) =>
  memberClient(roomId).post<{ hostId: string }>('/host', { userId })
