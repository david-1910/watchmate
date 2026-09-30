import { Request, Response, NextFunction, RequestHandler } from 'express'
import { roomsService } from '../rooms/rooms.service'
import { membersService } from '../members/members.service'
import { hostService } from '../members/host.service'
import { getRoomIdParam } from '../../shared/utils/params'
import { sendError, sendNotFound } from '../../shared/utils/response'
import { Member, Room } from '../../shared/types'

// Уровни доступа из CONTRACT.md, раздел 5: public (requireRoom), member, host

const ROOM_NOT_FOUND = 'Комната не найдена'

const loadRoom = (req: Request, res: Response): Room | null => {
  const roomId = getRoomIdParam(req)
  const room = roomId ? roomsService.findById(roomId) : undefined
  if (!room) sendNotFound(res, ROOM_NOT_FOUND)
  return room ?? null
}

const bearerToken = (req: Request): string | undefined => {
  const header = req.headers.authorization
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined
}

export const getRoom = (res: Response): Room => res.locals.room as Room
export const getMember = (res: Response): Member => res.locals.member as Member

export const requireRoom = (req: Request, res: Response, next: NextFunction): void => {
  const room = loadRoom(req, res)
  if (!room) return
  res.locals.room = room
  next()
}

export const requireMember = (req: Request, res: Response, next: NextFunction): void => {
  const room = loadRoom(req, res)
  if (!room) return
  const token = bearerToken(req)
  const member = token ? membersService.authenticate(room.id, token) : undefined
  if (!member) {
    sendError(res, 'Нужно войти в комнату заново', 'UNAUTHORIZED', 401)
    return
  }
  res.locals.room = room
  res.locals.member = member
  next()
}

const hostOnly = (_req: Request, res: Response, next: NextFunction): void => {
  if (!hostService.isHost(getRoom(res).id, getMember(res).userId)) {
    sendError(res, 'Только хост может выполнять это действие', 'FORBIDDEN', 403)
    return
  }
  next()
}

export const requireHost: RequestHandler[] = [requireMember, hostOnly]
