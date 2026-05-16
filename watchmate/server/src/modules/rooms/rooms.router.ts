import { Router, Request, Response } from 'express'
import { roomsService } from './rooms.service'
import { validate } from '../../shared/middleware/validate'
import { sendSuccess, sendError } from '../../shared/utils/response'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Rooms
 *   description: Управление комнатами
 */

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
 *               isPrivate:
 *                 type: boolean
 *                 default: false
 *               password:
 *                 type: string
 *                 description: Обязателен если isPrivate = true
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
 *                     data:
 *                       type: object
 *                       properties:
 *                         id: { type: string, example: ABC123 }
 *                         hostToken: { type: string }
 *                         isPrivate: { type: boolean }
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post(
  '/',
  validate([
    { field: 'isPrivate', type: 'boolean' },
    { field: 'password', type: 'string', minLength: 1 },
  ]),
  (req: Request, res: Response) => {
    const { isPrivate = false, password } = req.body ?? {}
    if (isPrivate && !password?.trim()) {
      sendError(res, 'Пароль обязателен для приватной комнаты', 'VALIDATION_ERROR', 400)
      return
    }
    const room = roomsService.create({ isPrivate: !!isPrivate, password })
    sendSuccess(res, room, 201)
  }
)

/**
 * @swagger
 * /rooms/{id}:
 *   get:
 *     summary: Получить информацию о комнате
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: ABC123
 *     responses:
 *       200:
 *         description: Информация о комнате
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Room'
 *       404:
 *         description: Комната не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/:id', (req: Request, res: Response) => {
  const id = req.params.id as string
  const room = roomsService.findById(id)
  if (!room) {
    sendError(res, 'Комната не найдена', 'NOT_FOUND', 404)
    return
  }
  sendSuccess(res, { id: room.id, createdAt: room.createdAt, isPrivate: room.isPrivate })
})

/**
 * @swagger
 * /rooms/{id}/verify:
 *   post:
 *     summary: Проверить пароль приватной комнаты
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Пароль верный
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
 *                         verified: { type: boolean, example: true }
 *       401:
 *         description: Неверный пароль
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Комната не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post(
  '/:id/verify',
  validate([{ field: 'password', type: 'string', required: true, minLength: 1 }]),
  (req: Request, res: Response) => {
    const id = req.params.id as string
    const { password } = req.body
    const room = roomsService.findById(id)
    if (!room) {
      sendError(res, 'Комната не найдена', 'NOT_FOUND', 404)
      return
    }
    if (roomsService.verifyPassword(id, password)) {
      sendSuccess(res, { verified: true })
    } else {
      sendError(res, 'Неверный пароль', 'UNAUTHORIZED', 401)
    }
  }
)

export { router as roomsRouter }
