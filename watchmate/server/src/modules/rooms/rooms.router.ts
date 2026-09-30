import { Router, Request, Response } from 'express'
import { roomsService } from './rooms.service'
import { requireRoom, requireHost, getRoom } from '../auth/auth.middleware'
import { AppServer } from '../socket/socket.types'
import { validate } from '../../shared/middleware/validate'
import { createRoomLimiter, codeLookupLimiter } from '../../shared/middleware/rateLimit'
import { sendSuccess, sendNotFound, sendValidationError } from '../../shared/utils/response'
import { SOCKET_EVENTS } from '../../shared/constants/socketEvents'

export const createRoomsRouter = (io: AppServer): Router => {
  const router = Router()

  /**
   * @swagger
   * /rooms:
   *   post:
   *     summary: Создать комнату
   *     tags: [Rooms]
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               isPrivate: { type: boolean, default: false }
   *               password: { type: string, description: 'Обязателен, если isPrivate = true' }
   *     responses:
   *       201:
   *         description: Комната создана
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiSuccess'
   *                 - type: object
   *                   properties:
   *                     data: { $ref: '#/components/schemas/CreatedRoom' }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       429: { $ref: '#/components/responses/RateLimit' }
   */
  router.post(
    '/',
    createRoomLimiter,
    validate([
      { field: 'isPrivate', type: 'boolean' },
      { field: 'password', type: 'string', minLength: 1 },
    ]),
    (req: Request, res: Response) => {
      const { isPrivate = false, password } = req.body ?? {}
      if (isPrivate && !password?.trim()) {
        sendValidationError(res, 'Пароль обязателен для приватной комнаты')
        return
      }
      sendSuccess(res, roomsService.create({ isPrivate, password }), 201)
    }
  )

  /**
   * @swagger
   * /rooms/by-code/{code}:
   *   get:
   *     summary: Найти комнату по коду входа
   *     description: 'Код нормализуется: верхний регистр, без дефисов и пробелов.'
   *     tags: [Rooms]
   *     parameters:
   *       - { in: path, name: code, required: true, schema: { type: string, example: ABC-234 } }
   *     responses:
   *       200:
   *         description: Комната найдена
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiSuccess'
   *                 - type: object
   *                   properties:
   *                     data: { $ref: '#/components/schemas/RoomInfo' }
   *       404: { $ref: '#/components/responses/NotFound' }
   *       429: { $ref: '#/components/responses/RateLimit' }
   */
  router.get('/by-code/:code', codeLookupLimiter, (req: Request, res: Response) => {
    const room = roomsService.findByCode(String(req.params.code))
    if (!room) {
      sendNotFound(res, 'Комната не найдена')
      return
    }
    sendSuccess(res, { id: room.id, isPrivate: room.isPrivate })
  })

  /**
   * @swagger
   * /rooms/{roomId}:
   *   get:
   *     summary: Получить информацию о комнате
   *     tags: [Rooms]
   *     parameters:
   *       - $ref: '#/components/parameters/RoomId'
   *     responses:
   *       200:
   *         description: Комната найдена
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiSuccess'
   *                 - type: object
   *                   properties:
   *                     data: { $ref: '#/components/schemas/RoomInfo' }
   *       404: { $ref: '#/components/responses/NotFound' }
   */
  router.get('/:roomId', requireRoom, (_req: Request, res: Response) => {
    const room = getRoom(res)
    sendSuccess(res, { id: room.id, isPrivate: room.isPrivate })
  })

  /**
   * @swagger
   * /rooms/{roomId}/code:
   *   post:
   *     summary: Сменить код входа (только хост)
   *     description: Старый код перестаёт работать сразу. Рассылает room-update.
   *     tags: [Rooms]
   *     security: [{ MemberToken: [] }]
   *     parameters:
   *       - $ref: '#/components/parameters/RoomId'
   *     responses:
   *       200:
   *         description: Новый код
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiSuccess'
   *                 - type: object
   *                   properties:
   *                     data: { type: object, properties: { joinCode: { type: string } } }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/NotFound' }
   */
  router.post('/:roomId/code', requireHost, (_req: Request, res: Response) => {
    const room = getRoom(res)
    const joinCode = roomsService.regenerateJoinCode(room)
    io.to(room.id).emit(SOCKET_EVENTS.ROOM_UPDATE, { joinCode })
    sendSuccess(res, { joinCode })
  })

  return router
}
