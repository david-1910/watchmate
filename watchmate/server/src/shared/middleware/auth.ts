import { Request, Response, NextFunction } from 'express'
import { state } from '../../modules/state/state'
import { sendError } from '../utils/response'

export const requireHost = (req: Request, res: Response, next: NextFunction): void => {
  const rawId = req.params.roomId ?? req.params.id ?? ''
  const roomId = (Array.isArray(rawId) ? rawId[0] : rawId).toUpperCase()
  const token = req.headers.authorization?.replace('Bearer ', '')

  const room = state.rooms.get(roomId)
  if (!room) {
    sendError(res, 'Комната не найдена', 'NOT_FOUND', 404)
    return
  }

  if (!token || room.hostToken !== token) {
    sendError(res, 'Только хост может выполнять это действие', 'FORBIDDEN', 403)
    return
  }

  next()
}
