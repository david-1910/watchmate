import { Router, Request, Response } from 'express'
import { playbackService } from './playback.service'
import { requireHost, getRoom } from '../auth/auth.middleware'
import { AppServer } from '../socket/socket.types'
import { validate } from '../../shared/middleware/validate'
import { sendSuccess } from '../../shared/utils/response'
import { SOCKET_EVENTS } from '../../shared/constants/socketEvents'

// /rooms/:roomId/video
export const createVideoRouter = (io: AppServer): Router => {
  const router = Router({ mergeParams: true })

  const respondWithVideo = (res: Response, roomId: string, video: string): void => {
    io.to(roomId).emit(SOCKET_EVENTS.VIDEO_UPDATE, video)
    sendSuccess(res, { video })
  }

  /**
   * @swagger
   * /rooms/{roomId}/video:
   *   put:
   *     summary: Установить текущее видео (только хост)
   *     description: Рассылает video-update.
   *     tags: [Video]
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
   *               url: { type: string, example: 'https://youtu.be/dQw4w9WgXcQ' }
   *     responses:
   *       200: { $ref: '#/components/responses/Video' }
   *       400: { $ref: '#/components/responses/ValidationError' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/NotFound' }
   *   delete:
   *     summary: Убрать текущее видео (только хост)
   *     description: Рассылает video-update с ''.
   *     tags: [Video]
   *     security: [{ MemberToken: [] }]
   *     parameters:
   *       - $ref: '#/components/parameters/RoomId'
   *     responses:
   *       200: { $ref: '#/components/responses/Video' }
   *       401: { $ref: '#/components/responses/Unauthorized' }
   *       403: { $ref: '#/components/responses/Forbidden' }
   *       404: { $ref: '#/components/responses/NotFound' }
   */
  router.put(
    '/',
    requireHost,
    validate([{ field: 'url', type: 'string', required: true, minLength: 1 }]),
    (req: Request, res: Response) => {
      const roomId = getRoom(res).id
      respondWithVideo(res, roomId, playbackService.setVideo(roomId, req.body.url))
    }
  )

  router.delete('/', requireHost, (_req: Request, res: Response) => {
    const roomId = getRoom(res).id
    respondWithVideo(res, roomId, playbackService.clearVideo(roomId))
  })

  return router
}
