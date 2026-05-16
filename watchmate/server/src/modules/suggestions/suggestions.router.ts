import { Router, Request, Response } from 'express'
import { Server } from 'socket.io'
import { suggestionsService } from './suggestions.service'
import { requireHost } from '../../shared/middleware/auth'
import { validate } from '../../shared/middleware/validate'
import { sendSuccess, sendError } from '../../shared/utils/response'
import { SOCKET_EVENTS } from '../../shared/constants/socketEvents'
import { state } from '../state/state'

export const createSuggestionsRouter = (io: Server): Router => {
  const router = Router({ mergeParams: true })

  /**
   * @swagger
   * /rooms/{roomId}/suggestions:
   *   get:
   *     summary: Получить список предложений
   *     tags: [Suggestions]
   *     parameters:
   *       - in: path
   *         name: roomId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Список предложений
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiSuccess'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Suggestion'
   */
  router.get('/', (req: Request, res: Response) => {
    const roomId = (req.params.roomId as string).toUpperCase()
    sendSuccess(res, suggestionsService.getSuggestions(roomId))
  })

  /**
   * @swagger
   * /rooms/{roomId}/suggestions:
   *   post:
   *     summary: Предложить видео
   *     tags: [Suggestions]
   *     parameters:
   *       - in: path
   *         name: roomId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [url, userName]
   *             properties:
   *               url:
   *                 type: string
   *               title:
   *                 type: string
   *               userName:
   *                 type: string
   *     responses:
   *       201:
   *         description: Предложение добавлено
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiSuccess'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Suggestion'
   *       404:
   *         description: Комната не найдена
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiError'
   */
  router.post(
    '/',
    validate([
      { field: 'url', type: 'string', required: true, minLength: 1 },
      { field: 'title', type: 'string' },
      { field: 'userName', type: 'string', required: true, minLength: 1 },
    ]),
    (req: Request, res: Response) => {
      const roomId = (req.params.roomId as string).toUpperCase()
      const { url, title, userName } = req.body

      if (!state.rooms.get(roomId)) {
        sendError(res, 'Комната не найдена', 'NOT_FOUND', 404)
        return
      }

      const suggestions = suggestionsService.suggest(roomId, url, title, userName, 'rest-client')
      io.to(roomId).emit(SOCKET_EVENTS.SUGGESTIONS_UPDATE, suggestions)
      sendSuccess(res, suggestions, 201)
    }
  )

  /**
   * @swagger
   * /rooms/{roomId}/suggestions/{suggestionId}/accept:
   *   patch:
   *     summary: Принять предложение (только хост)
   *     tags: [Suggestions]
   *     security:
   *       - HostToken: []
   *     parameters:
   *       - in: path
   *         name: roomId
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: suggestionId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Предложение принято и добавлено в очередь
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiSuccess'
   *       404:
   *         description: Предложение не найдено
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiError'
   *       403:
   *         description: Только хост
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiError'
   */
  router.patch('/:suggestionId/accept', requireHost, (req: Request, res: Response) => {
    const roomId = (req.params.roomId as string).toUpperCase()
    const result = suggestionsService.accept(roomId, req.params.suggestionId as string)
    if (!result) {
      sendError(res, 'Предложение не найдено', 'NOT_FOUND', 404)
      return
    }
    io.to(roomId).emit(SOCKET_EVENTS.QUEUE_UPDATE, result.queue)
    io.to(roomId).emit(SOCKET_EVENTS.SUGGESTIONS_UPDATE, result.suggestions)
    sendSuccess(res, result)
  })

  /**
   * @swagger
   * /rooms/{roomId}/suggestions/{suggestionId}:
   *   delete:
   *     summary: Отклонить предложение (только хост)
   *     tags: [Suggestions]
   *     security:
   *       - HostToken: []
   *     parameters:
   *       - in: path
   *         name: roomId
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: suggestionId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Предложение отклонено
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiSuccess'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Suggestion'
   *       403:
   *         description: Только хост
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiError'
   */
  router.delete('/:suggestionId', requireHost, (req: Request, res: Response) => {
    const roomId = (req.params.roomId as string).toUpperCase()
    const suggestions = suggestionsService.reject(roomId, req.params.suggestionId as string)
    io.to(roomId).emit(SOCKET_EVENTS.SUGGESTIONS_UPDATE, suggestions)
    sendSuccess(res, suggestions)
  })

  return router
}
