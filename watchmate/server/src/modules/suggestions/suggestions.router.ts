import { Router, Request, Response } from 'express'
import { suggestionsService } from './suggestions.service'
import { requireMember, requireHost, getRoom, getMember } from '../auth/auth.middleware'
import { AppServer } from '../socket/socket.types'
import { validate } from '../../shared/middleware/validate'
import { sendSuccess, sendNotFound } from '../../shared/utils/response'
import { SOCKET_EVENTS } from '../../shared/constants/socketEvents'
import { Suggestion } from '../../shared/types'

// /rooms/:roomId/suggestions
export const createSuggestionsRouter = (io: AppServer): Router => {
  const router = Router({ mergeParams: true })

  const respondWithSuggestions = (res: Response, roomId: string, suggestions: Suggestion[], status = 200): void => {
    io.to(roomId).emit(SOCKET_EVENTS.SUGGESTIONS_UPDATE, suggestions)
    sendSuccess(res, suggestions, status)
  }

  /**
   * @swagger
   * /rooms/{roomId}/suggestions:
   *   get:
   *     summary: Получить предложения
   *     tags: [Suggestions]
   *     security: [{ MemberToken: [] }]
   *     parameters:
   *       - $ref: '#/components/parameters/RoomId'
   *     responses:
   *       200: { $ref: '#/components/responses/Suggestions' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       404: { $ref: '#/components/responses/NotFound' }
   *   post:
   *     summary: Предложить видео
   *     description: Рассылает suggestions-update. suggestedById — userId участника.
   *     tags: [Suggestions]
   *     security: [{ MemberToken: [] }]
   *     parameters:
   *       - $ref: '#/components/parameters/RoomId'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [url]
   *             properties:
   *               url: { type: string }
   *               title: { type: string }
   *     responses:
   *       201: { $ref: '#/components/responses/Suggestions' }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       404: { $ref: '#/components/responses/NotFound' }
   */
  router.get('/', requireMember, (_req: Request, res: Response) => {
    sendSuccess(res, suggestionsService.getSuggestions(getRoom(res).id))
  })

  router.post(
    '/',
    requireMember,
    validate([
      { field: 'url', type: 'string', required: true, minLength: 1 },
      { field: 'title', type: 'string' },
    ]),
    (req: Request, res: Response) => {
      const roomId = getRoom(res).id
      const { userId, userName } = getMember(res)
      const suggestions = suggestionsService.suggest(roomId, { url: req.body.url, title: req.body.title, userName, userId })
      respondWithSuggestions(res, roomId, suggestions, 201)
    }
  )

  /**
   * @swagger
   * /rooms/{roomId}/suggestions/{id}/accept:
   *   patch:
   *     summary: Принять предложение в очередь (только хост)
   *     description: Рассылает queue-update и suggestions-update.
   *     tags: [Suggestions]
   *     security: [{ MemberToken: [] }]
   *     parameters:
   *       - $ref: '#/components/parameters/RoomId'
   *       - { in: path, name: id, required: true, schema: { type: string } }
   *     responses:
   *       200:
   *         description: Предложение принято
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
   *                         queue: { type: array, items: { $ref: '#/components/schemas/QueueItem' } }
   *                         suggestions: { type: array, items: { $ref: '#/components/schemas/Suggestion' } }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/NotFound' }
   */
  router.patch('/:id/accept', requireHost, (req: Request, res: Response) => {
    const roomId = getRoom(res).id
    const result = suggestionsService.accept(roomId, String(req.params.id))
    if (!result) {
      sendNotFound(res, 'Предложение не найдено')
      return
    }
    io.to(roomId).emit(SOCKET_EVENTS.QUEUE_UPDATE, result.queue)
    io.to(roomId).emit(SOCKET_EVENTS.SUGGESTIONS_UPDATE, result.suggestions)
    sendSuccess(res, { queue: result.queue, suggestions: result.suggestions })
  })

  /**
   * @swagger
   * /rooms/{roomId}/suggestions/{id}:
   *   delete:
   *     summary: Отклонить предложение (только хост)
   *     description: Рассылает suggestions-update.
   *     tags: [Suggestions]
   *     security: [{ MemberToken: [] }]
   *     parameters:
   *       - $ref: '#/components/parameters/RoomId'
   *       - { in: path, name: id, required: true, schema: { type: string } }
   *     responses:
   *       200: { $ref: '#/components/responses/Suggestions' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/NotFound' }
   */
  router.delete('/:id', requireHost, (req: Request, res: Response) => {
    const roomId = getRoom(res).id
    respondWithSuggestions(res, roomId, suggestionsService.reject(roomId, String(req.params.id)))
  })

  return router
}
