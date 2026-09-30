import { Router, Request, Response } from 'express'
import { chatService } from './chat.service'
import { requireMember, getRoom, getMember } from '../auth/auth.middleware'
import { AppServer } from '../socket/socket.types'
import { validate } from '../../shared/middleware/validate'
import { sendSuccess, sendValidationError } from '../../shared/utils/response'
import { SOCKET_EVENTS } from '../../shared/constants/socketEvents'
import { MESSAGE_MAX_LENGTH } from '../../shared/constants/limits'

// afterSeq — неотрицательное целое, по умолчанию 0; null — невалидное значение
const parseAfterSeq = (raw: unknown): number | null => {
  if (raw === undefined) return 0
  const value = Number(raw)
  return typeof raw === 'string' && raw !== '' && Number.isInteger(value) && value >= 0 ? value : null
}

// /rooms/:roomId/messages
export const createChatRouter = (io: AppServer): Router => {
  const router = Router({ mergeParams: true })

  /**
   * @swagger
   * /rooms/{roomId}/messages:
   *   get:
   *     summary: Сообщения после afterSeq (от старых к новым)
   *     tags: [Chat]
   *     security: [{ MemberToken: [] }]
   *     parameters:
   *       - $ref: '#/components/parameters/RoomId'
   *       - { in: query, name: afterSeq, schema: { type: integer, minimum: 0, default: 0 } }
   *     responses:
   *       200:
   *         description: Сообщения с seq > afterSeq
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
   *                         messages: { type: array, items: { $ref: '#/components/schemas/ChatMessage' } }
   *                         lastSeq: { type: integer }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       404: { $ref: '#/components/responses/NotFound' }
   */
  router.get('/', requireMember, (req: Request, res: Response) => {
    const afterSeq = parseAfterSeq(req.query.afterSeq)
    if (afterSeq === null) {
      sendValidationError(res, 'Параметр "afterSeq" должен быть неотрицательным целым числом')
      return
    }
    sendSuccess(res, chatService.getMessages(getRoom(res).id, afterSeq))
  })

  /**
   * @swagger
   * /rooms/{roomId}/messages:
   *   post:
   *     summary: Отправить сообщение
   *     description: Идемпотентно по clientId. Новое сообщение рассылается как message-new всей комнате, включая отправителя; повтор возвращает существующее без рассылки.
   *     tags: [Chat]
   *     security: [{ MemberToken: [] }]
   *     parameters:
   *       - $ref: '#/components/parameters/RoomId'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [clientId, message]
   *             properties:
   *               clientId: { type: string, format: uuid }
   *               message: { type: string, maxLength: 500 }
   *     responses:
   *       200:
   *         description: Повтор clientId — существующее сообщение
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiSuccess'
   *                 - type: object
   *                   properties:
   *                     data: { $ref: '#/components/schemas/ChatMessage' }
   *       201:
   *         description: Сообщение сохранено
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiSuccess'
   *                 - type: object
   *                   properties:
   *                     data: { $ref: '#/components/schemas/ChatMessage' }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       404: { $ref: '#/components/responses/NotFound' }
   */
  router.post(
    '/',
    requireMember,
    validate([
      { field: 'clientId', type: 'uuid', required: true },
      { field: 'message', type: 'string', required: true, minLength: 1, maxLength: MESSAGE_MAX_LENGTH },
    ]),
    (req: Request, res: Response) => {
      const roomId = getRoom(res).id
      const { userId, userName } = getMember(res)
      const { clientId, message } = req.body
      const result = chatService.post(roomId, { clientId, message, userId, userName })
      if (result.created) io.to(roomId).emit(SOCKET_EVENTS.MESSAGE_NEW, result.message)
      sendSuccess(res, result.message, result.created ? 201 : 200)
    }
  )

  return router
}
