import { Router, Request, Response } from 'express'
import { Server } from 'socket.io'
import { queueService } from './queue.service'
import { requireHost } from '../../shared/middleware/auth'
import { validate } from '../../shared/middleware/validate'
import { sendSuccess, sendError } from '../../shared/utils/response'
import { SOCKET_EVENTS } from '../../shared/constants/socketEvents'

export const createQueueRouter = (io: Server): Router => {
  const router = Router({ mergeParams: true })

  /**
   * @swagger
   * /rooms/{roomId}/queue:
   *   get:
   *     summary: Получить очередь комнаты
   *     tags: [Queue]
   *     parameters:
   *       - in: path
   *         name: roomId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Список элементов очереди
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
   *                         $ref: '#/components/schemas/QueueItem'
   */
  router.get('/', (req: Request, res: Response) => {
    const roomId = (req.params.roomId as string).toUpperCase()
    sendSuccess(res, queueService.getQueue(roomId))
  })

  /**
   * @swagger
   * /rooms/{roomId}/queue:
   *   post:
   *     summary: Добавить элемент в очередь (только хост)
   *     tags: [Queue]
   *     security:
   *       - HostToken: []
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
   *             required: [url]
   *             properties:
   *               url:
   *                 type: string
   *               title:
   *                 type: string
   *     responses:
   *       201:
   *         description: Элемент добавлен
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
   *                         $ref: '#/components/schemas/QueueItem'
   *       403:
   *         description: Только хост
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiError'
   */
  router.post(
    '/',
    requireHost,
    validate([
      { field: 'url', type: 'string', required: true, minLength: 1 },
      { field: 'title', type: 'string' },
    ]),
    (req: Request, res: Response) => {
      const roomId = (req.params.roomId as string).toUpperCase()
      const { url, title } = req.body
      const queue = queueService.add(roomId, url, title)
      io.to(roomId).emit(SOCKET_EVENTS.QUEUE_UPDATE, queue)
      sendSuccess(res, queue, 201)
    }
  )

  /**
   * @swagger
   * /rooms/{roomId}/queue/{itemId}:
   *   delete:
   *     summary: Удалить элемент из очереди (только хост)
   *     tags: [Queue]
   *     security:
   *       - HostToken: []
   *     parameters:
   *       - in: path
   *         name: roomId
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: itemId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Элемент удалён
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
   *                         $ref: '#/components/schemas/QueueItem'
   *       403:
   *         description: Только хост
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiError'
   */
  router.delete('/:itemId', requireHost, (req: Request, res: Response) => {
    const roomId = (req.params.roomId as string).toUpperCase()
    const queue = queueService.remove(roomId, req.params.itemId as string)
    io.to(roomId).emit(SOCKET_EVENTS.QUEUE_UPDATE, queue)
    sendSuccess(res, queue)
  })

  /**
   * @swagger
   * /rooms/{roomId}/queue/next:
   *   patch:
   *     summary: Воспроизвести следующий элемент (только хост)
   *     tags: [Queue]
   *     security:
   *       - HostToken: []
   *     parameters:
   *       - in: path
   *         name: roomId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Следующий элемент запущен
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiSuccess'
   *       400:
   *         description: Очередь пуста
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
  router.patch('/next', requireHost, (req: Request, res: Response) => {
    const roomId = (req.params.roomId as string).toUpperCase()
    const result = queueService.next(roomId)
    if (!result) {
      sendError(res, 'Очередь пуста', 'QUEUE_EMPTY', 400)
      return
    }
    io.to(roomId).emit(SOCKET_EVENTS.QUEUE_UPDATE, result.queue)
    io.to(roomId).emit(SOCKET_EVENTS.VIDEO_UPDATE, result.url)
    sendSuccess(res, result)
  })

  /**
   * @swagger
   * /rooms/{roomId}/queue/{itemId}/play:
   *   patch:
   *     summary: Воспроизвести конкретный элемент (только хост)
   *     tags: [Queue]
   *     security:
   *       - HostToken: []
   *     parameters:
   *       - in: path
   *         name: roomId
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: itemId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Элемент запущен
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiSuccess'
   *       404:
   *         description: Элемент не найден
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
  router.patch('/:itemId/play', requireHost, (req: Request, res: Response) => {
    const roomId = (req.params.roomId as string).toUpperCase()
    const result = queueService.play(roomId, req.params.itemId as string)
    if (!result) {
      sendError(res, 'Элемент не найден', 'NOT_FOUND', 404)
      return
    }
    io.to(roomId).emit(SOCKET_EVENTS.QUEUE_UPDATE, result.queue)
    io.to(roomId).emit(SOCKET_EVENTS.VIDEO_UPDATE, result.url)
    sendSuccess(res, result)
  })

  /**
   * @swagger
   * /rooms/{roomId}/queue/reorder:
   *   patch:
   *     summary: Изменить порядок очереди (только хост)
   *     tags: [Queue]
   *     security:
   *       - HostToken: []
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
   *             required: [fromIndex, toIndex]
   *             properties:
   *               fromIndex:
   *                 type: integer
   *               toIndex:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Порядок изменён
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
   *                         $ref: '#/components/schemas/QueueItem'
   *       400:
   *         description: Некорректные индексы
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
  router.patch(
    '/reorder',
    requireHost,
    validate([
      { field: 'fromIndex', type: 'string' },
      { field: 'toIndex', type: 'string' },
    ]),
    (req: Request, res: Response) => {
      const roomId = (req.params.roomId as string).toUpperCase()
      const fromIndex = Number(req.body.fromIndex)
      const toIndex = Number(req.body.toIndex)
      const queue = queueService.reorder(roomId, fromIndex, toIndex)
      if (!queue) {
        sendError(res, 'Некорректные индексы', 'VALIDATION_ERROR', 400)
        return
      }
      io.to(roomId).emit(SOCKET_EVENTS.QUEUE_UPDATE, queue)
      sendSuccess(res, queue)
    }
  )

  return router
}
