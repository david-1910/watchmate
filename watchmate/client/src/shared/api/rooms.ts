import { http } from './http'

type CreateRoomOptions = { isPrivate?: boolean; password?: string }
type CreateRoomResponse = { id: string; hostToken: string; isPrivate: boolean }
type RoomInfo = { id: string; createdAt: string; isPrivate: boolean }

export const createRoom = (options: CreateRoomOptions = {}): Promise<CreateRoomResponse> =>
  http.post<CreateRoomResponse>('/rooms', options)

export const getRoom = async (id: string): Promise<RoomInfo | null> => {
  try {
    return await http.get<RoomInfo>(`/rooms/${id}`)
  } catch {
    return null
  }
}

export const verifyRoomPassword = async (id: string, password: string): Promise<boolean> => {
  try {
    await http.post(`/rooms/${id}/verify`, { password })
    return true
  } catch {
    return false
  }
}
