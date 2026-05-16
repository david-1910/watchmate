import { Router, Request, Response } from 'express'
import { state } from '../state/state'
import { sendSuccess, sendError } from '../../shared/utils/response'

const router = Router({ mergeParams: true })

/**
 * @swagger
 * /rooms/{roomId}/users:
 *   get:
 *     summary: Получить список пользователей комнаты
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         example: ABC123
 *     responses:
 *       200:
 *         description: Список пользователей и статус готовности
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         users:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/RoomUser'
 *                         hostId:
 *                           type: string
 *                           nullable: true
 *                         readyUsers:
 *                           type: array
 *                           items:
 *                             type: string
 *       404:
 *         description: Комната не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/', (req: Request, res: Response) => {
  const roomId = (req.params.roomId as string).toUpperCase()

  if (!state.rooms.get(roomId)) {
    sendError(res, 'Комната не найдена', 'NOT_FOUND', 404)
    return
  }

  const users = state.getRoomUsers(roomId)
  const hostId = state.roomHosts.get(roomId) ?? null
  const readyUsers = state.getRoomReadyUsers(roomId)

  sendSuccess(res, { users, hostId, readyUsers })
})

export { router as roomUsersRouter }
