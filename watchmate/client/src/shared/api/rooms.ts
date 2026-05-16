import { http } from './http'

type CreateRoomOptions = { isPrivate?: boolean; password?: string }

type CreateRoomData = { id: string; hostToken: string; isPrivate: boolean }
type RoomInfoData = { id: string; createdAt: string; isPrivate: boolean }
type VerifyData = { verified: boolean }

type ApiSuccess<T> = { success: true; data: T }

const unwrap = <T>(res: ApiSuccess<T>): T => res.data

export const createRoom = (options: CreateRoomOptions = {}): Promise<CreateRoomData> =>
  http.post<ApiSuccess<CreateRoomData>>('/rooms', options).then(unwrap)

export const getRoom = async (id: string): Promise<RoomInfoData | null> => {
  try {
    return await http.get<ApiSuccess<RoomInfoData>>(`/rooms/${id}`).then(unwrap)
  } catch {
    return null
  }
}

export const verifyRoomPassword = async (id: string, password: string): Promise<boolean> => {
  try {
    const res = await http.post<ApiSuccess<VerifyData>>(`/rooms/${id}/verify`, { password })
    return res.data.verified
  } catch {
    return false
  }
}
