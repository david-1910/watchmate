import { Router, Request, Response } from 'express'
import { membersService } from './members.service'
import { hostService } from './host.service'
import { requireRoom, requireMember, requireHost, getRoom, getMember } from '../auth/auth.middleware'
import { validate } from '../../shared/middleware/validate'
import { joinLimiter } from '../../shared/middleware/rateLimit'
import { sendSuccess, sendError, sendNotFound, sendValidationError } from '../../shared/utils/response'
import { USERNAME_MAX_LENGTH } from '../../shared/constants/limits'

// /rooms/:roomId/members
export const membersRouter = Router({ mergeParams: true })

/**
 * @swagger
 * /rooms/{roomId}/members:
 *   post:
 *     summary: Войти в комнату (создать участника)
 *     description: |
 *       Приватная комната всегда требует верный password; верный hostToken пропускает проверку пароля.
 *       hostToken делает участника хостом, только если хоста нет или он офлайн.
 *     tags: [Members]
 *     parameters:
 *       - $ref: '#/components/parameters/RoomId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userName]
 *             properties:
 *               userName: { type: string, maxLength: 30 }
 *               password: { type: string }
 *               hostToken: { type: string }
 *     responses:
 *       201:
 *         description: Участник создан
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/JoinedMember' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/WrongPassword' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       429: { $ref: '#/components/responses/RateLimit' }
 */
membersRouter.post(
  '/',
  joinLimiter,
  requireRoom,
  validate([
    { field: 'userName', type: 'string', required: true, minLength: 1, maxLength: USERNAME_MAX_LENGTH },
    { field: 'password', type: 'string' },
    { field: 'hostToken', type: 'string' },
  ]),
  (req: Request, res: Response) => {
    const { userName, password, hostToken } = req.body
    const result = membersService.join(getRoom(res), { userName, password, hostToken })
    if (!result) {
      sendError(res, 'Неверный пароль', 'WRONG_PASSWORD', 401)
      return
    }
    sendSuccess(res, result, 201)
  }
)

/**
 * @swagger
 * /rooms/{roomId}/members/me:
 *   delete:
 *     summary: Выйти из комнаты
 *     description: Участник удаляется сразу; если это хост, роль передаётся сразу.
 *     tags: [Members]
 *     security: [{ MemberToken: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/RoomId'
 *     responses:
 *       200:
 *         description: Участник удалён
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { type: object, properties: { left: { type: boolean, example: true } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
membersRouter.delete('/me', requireMember, (_req: Request, res: Response) => {
  membersService.leave(getRoom(res).id, getMember(res).userId)
  sendSuccess(res, { left: true })
})

// /rooms/:roomId/host
export const hostRouter = Router({ mergeParams: true })

/**
 * @swagger
 * /rooms/{roomId}/host:
 *   post:
 *     summary: Передать роль хоста онлайн-участнику (только хост)
 *     description: Рассылает host-update.
 *     tags: [Members]
 *     security: [{ MemberToken: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/RoomId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Роль передана
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { type: object, properties: { hostId: { type: string } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
hostRouter.post(
  '/',
  requireHost,
  validate([{ field: 'userId', type: 'uuid', required: true }]),
  (req: Request, res: Response) => {
    const { userId } = req.body
    const result = hostService.transfer(getRoom(res).id, userId)
    if (result === 'not-found') {
      sendNotFound(res, 'Участник не найден')
      return
    }
    if (result === 'offline') {
      sendValidationError(res, 'Участник не в сети')
      return
    }
    sendSuccess(res, { hostId: userId })
  }
)
