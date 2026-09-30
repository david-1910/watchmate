"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVideoRouter = void 0;
const express_1 = require("express");
const playback_service_1 = require("./playback.service");
const auth_middleware_1 = require("../auth/auth.middleware");
const validate_1 = require("../../shared/middleware/validate");
const response_1 = require("../../shared/utils/response");
const socketEvents_1 = require("../../shared/constants/socketEvents");
// /rooms/:roomId/video
const createVideoRouter = (io) => {
    const router = (0, express_1.Router)({ mergeParams: true });
    const respondWithVideo = (res, roomId, video) => {
        io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.VIDEO_UPDATE, video);
        (0, response_1.sendSuccess)(res, { video });
    };
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
    router.put('/', auth_middleware_1.requireHost, (0, validate_1.validate)([{ field: 'url', type: 'string', required: true, minLength: 1 }]), (req, res) => {
        const roomId = (0, auth_middleware_1.getRoom)(res).id;
        respondWithVideo(res, roomId, playback_service_1.playbackService.setVideo(roomId, req.body.url));
    });
    router.delete('/', auth_middleware_1.requireHost, (_req, res) => {
        const roomId = (0, auth_middleware_1.getRoom)(res).id;
        respondWithVideo(res, roomId, playback_service_1.playbackService.clearVideo(roomId));
    });
    return router;
};
exports.createVideoRouter = createVideoRouter;
