import { Router, Request, Response } from 'express'
import { queueService } from './queue.service'
import { requireMember, requireHost, getRoom } from '../auth/auth.middleware'
import { AppServer } from '../socket/socket.types'
import { validate } from '../../shared/middleware/validate'
import { sendSuccess, sendError, sendNotFound, sendValidationError } from '../../shared/utils/response'
import { SOCKET_EVENTS } from '../../shared/constants/socketEvents'
import { QueueItem } from '../../shared/types'

// /rooms/:roomId/queue
export const createQueueRouter = (io: AppServer): Router => {
  const router = Router({ mergeParams: true })

  const respondWithQueue = (res: Response, roomId: string, queue: QueueItem[], status = 200): void => {
    io.to(roomId).emit(SOCKET_EVENTS.QUEUE_UPDATE, queue)
    sendSuccess(res, queue, status)
  }

  const respondWithPlayed = (res: Response, roomId: string, result: { video: string; queue: QueueItem[] }): void => {
    io.to(roomId).emit(SOCKET_EVENTS.VIDEO_UPDATE, result.video)
    io.to(roomId).emit(SOCKET_EVENTS.QUEUE_UPDATE, result.queue)
    sendSuccess(res, result)
  }

  /**
   * @swagger
   * /rooms/{roomId}/queue:
   *   get:
   *     summary: Получить очередь
   *     tags: [Queue]
   *     security: [{ MemberToken: [] }]
   *     parameters:
   *       - $ref: '#/components/parameters/RoomId'
   *     responses:
   *       200: { $ref: '#/components/responses/Queue' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       404: { $ref: '#/components/responses/NotFound' }
   *   post:
   *     summary: Добавить видео в очередь (только хост)
   *     description: Рассылает queue-update.
   *     tags: [Queue]
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
   *       201: { $ref: '#/components/responses/Queue' }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/NotFound' }
   */
  router.get('/', requireMember, (_req: Request, res: Response) => {
    sendSuccess(res, queueService.getQueue(getRoom(res).id))
  })

  router.post(
    '/',
    requireHost,
    validate([
      { field: 'url', type: 'string', required: true, minLength: 1 },
      { field: 'title', type: 'string' },
    ]),
    (req: Request, res: Response) => {
      const roomId = getRoom(res).id
      respondWithQueue(res, roomId, queueService.add(roomId, req.body.url, req.body.title), 201)
    }
  )

  /**
   * @swagger
   * /rooms/{roomId}/queue/next:
   *   patch:
   *     summary: Включить следующее видео из очереди (только хост)
   *     description: Рассылает video-update и queue-update.
   *     tags: [Queue]
   *     security: [{ MemberToken: [] }]
   *     parameters:
   *       - $ref: '#/components/parameters/RoomId'
   *     responses:
   *       200: { $ref: '#/components/responses/Played' }
   *       400: { description: Очередь пуста, content: { application/json: { schema: { $ref: '#/components/schemas/ApiError' } } } }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/NotFound' }
   */
  router.patch('/next', requireHost, (_req: Request, res: Response) => {
    const roomId = getRoom(res).id
    const result = queueService.next(roomId)
    if (!result) {
      sendError(res, 'Очередь пуста', 'VALIDATION_ERROR', 400)
      return
    }
    respondWithPlayed(res, roomId, result)
  })

  /**
   * @swagger
   * /rooms/{roomId}/queue/reorder:
   *   patch:
   *     summary: Изменить порядок очереди (только хост)
   *     description: Рассылает queue-update.
   *     tags: [Queue]
   *     security: [{ MemberToken: [] }]
   *     parameters:
   *       - $ref: '#/components/parameters/RoomId'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [fromIndex, toIndex]
   *             properties:
   *               fromIndex: { type: integer }
   *               toIndex: { type: integer }
   *     responses:
   *       200: { $ref: '#/components/responses/Queue' }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/NotFound' }
   */
  router.patch(
    '/reorder',
    requireHost,
    validate([
      { field: 'fromIndex', type: 'integer', required: true },
      { field: 'toIndex', type: 'integer', required: true },
    ]),
    (req: Request, res: Response) => {
      const roomId = getRoom(res).id
      const queue = queueService.reorder(roomId, req.body.fromIndex, req.body.toIndex)
      if (!queue) {
        sendValidationError(res, 'Некорректные индексы')
        return
      }
      respondWithQueue(res, roomId, queue)
    }
  )

  /**
   * @swagger
   * /rooms/{roomId}/queue/{itemId}:
   *   delete:
   *     summary: Удалить видео из очереди (только хост)
   *     description: Рассылает queue-update.
   *     tags: [Queue]
   *     security: [{ MemberToken: [] }]
   *     parameters:
   *       - $ref: '#/components/parameters/RoomId'
   *       - { in: path, name: itemId, required: true, schema: { type: string } }
   *     responses:
   *       200: { $ref: '#/components/responses/Queue' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/NotFound' }
   */
  router.delete('/:itemId', requireHost, (req: Request, res: Response) => {
    const roomId = getRoom(res).id
    respondWithQueue(res, roomId, queueService.remove(roomId, String(req.params.itemId)))
  })

  /**
   * @swagger
   * /rooms/{roomId}/queue/{itemId}/play:
   *   patch:
   *     summary: Включить видео из очереди (только хост)
   *     description: Рассылает video-update и queue-update.
   *     tags: [Queue]
   *     security: [{ MemberToken: [] }]
   *     parameters:
   *       - $ref: '#/components/parameters/RoomId'
   *       - { in: path, name: itemId, required: true, schema: { type: string } }
   *     responses:
   *       200: { $ref: '#/components/responses/Played' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/NotFound' }
   */
  router.patch('/:itemId/play', requireHost, (req: Request, res: Response) => {
    const roomId = getRoom(res).id
    const result = queueService.play(roomId, String(req.params.itemId))
    if (!result) {
      sendNotFound(res, 'Элемент не найден')
      return
    }
    respondWithPlayed(res, roomId, result)
  })

  return router
}
