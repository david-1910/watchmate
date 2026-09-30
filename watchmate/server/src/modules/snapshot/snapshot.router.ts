import { Router, Request, Response } from 'express'
import { snapshotService } from './snapshot.service'
import { requireMember, getRoom, getMember } from '../auth/auth.middleware'
import { sendSuccess } from '../../shared/utils/response'

// /rooms/:roomId/state
export const snapshotRouter = Router({ mergeParams: true })

/**
 * @swagger
 * /rooms/{roomId}/state:
 *   get:
 *     summary: Снимок состояния комнаты
 *     description: Клиент запрашивает его при каждом подключении сокета.
 *     tags: [Rooms]
 *     security: [{ MemberToken: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/RoomId'
 *     responses:
 *       200:
 *         description: Снимок комнаты
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/RoomSnapshot' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
snapshotRouter.get('/', requireMember, (_req: Request, res: Response) => {
  sendSuccess(res, snapshotService.build(getRoom(res), getMember(res).userId))
})
