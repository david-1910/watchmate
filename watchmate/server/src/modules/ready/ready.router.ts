import { Router, Request, Response } from 'express'
import { readyService } from './ready.service'
import { emitCountdown } from './ready.countdown'
import { requireMember, requireHost, getRoom, getMember } from '../auth/auth.middleware'
import { hostService } from '../members/host.service'
import { AppServer } from '../socket/socket.types'
import { sendSuccess, sendError } from '../../shared/utils/response'
import { SOCKET_EVENTS } from '../../shared/constants/socketEvents'

// /rooms/:roomId/ready
export const createReadyRouter = (io: AppServer): Router => {
  const router = Router({ mergeParams: true })

  /**
   * @swagger
   * /rooms/{roomId}/ready/toggle:
   *   post:
   *     summary: Переключить готовность (только зритель)
   *     description: Рассылает ready-update. Хост готов по умолчанию и в подсчёте не участвует. Отсчёт сам не запускается — его запускает хост через /ready/start.
   *     tags: [Ready]
   *     security: [{ MemberToken: [] }]
   *     parameters:
   *       - $ref: '#/components/parameters/RoomId'
   *     responses:
   *       200:
   *         description: Состояние готовности
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiSuccess'
   *                 - type: object
   *                   properties:
   *                     data: { $ref: '#/components/schemas/ReadyState' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/NotFound' }
   */
  router.post('/toggle', requireMember, (_req: Request, res: Response) => {
    const roomId = getRoom(res).id
    const { userId } = getMember(res)
    if (hostService.isHost(roomId, userId)) {
      sendError(res, 'Хост готов по умолчанию', 'FORBIDDEN', 403)
      return
    }
    const ready = readyService.toggle(roomId, userId)
    io.to(roomId).emit(SOCKET_EVENTS.READY_UPDATE, ready)
    sendSuccess(res, ready)
  })

  /**
   * @swagger
   * /rooms/{roomId}/ready/start:
   *   post:
   *     summary: Начать просмотр (только хост)
   *     description: Когда все онлайн-зрители готовы, запускает countdown 3→0, после чего готовность сбрасывается (ready-update).
   *     tags: [Ready]
   *     security: [{ MemberToken: [] }]
   *     parameters:
   *       - $ref: '#/components/parameters/RoomId'
   *     responses:
   *       200:
   *         description: Отсчёт запущен
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiSuccess'
   *                 - type: object
   *                   properties:
   *                     data: { type: object, properties: { started: { type: boolean } } }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/NotFound' }
   */
  router.post('/start', requireHost, (_req: Request, res: Response) => {
    const roomId = getRoom(res).id
    const result = readyService.start(roomId)
    if (result === 'not-ready') {
      sendError(res, 'Не все зрители готовы', 'VALIDATION_ERROR', 400)
      return
    }
    if (result === 'running') {
      sendError(res, 'Отсчёт уже идёт', 'VALIDATION_ERROR', 400)
      return
    }
    emitCountdown(io, roomId)
    sendSuccess(res, { started: true })
  })

  return router
}
