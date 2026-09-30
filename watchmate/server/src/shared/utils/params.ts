import { Request } from 'express'
import { isRoomId } from './validators'

// roomId из пути; null, если это не UUID в нижнем регистре
export const getRoomIdParam = (req: Request): string | null => {
  const raw = req.params.roomId
  const value = Array.isArray(raw) ? raw[0] : raw
  return isRoomId(value) ? value : null
}
