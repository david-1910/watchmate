"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQueueRouter = void 0;
const express_1 = require("express");
const queue_service_1 = require("./queue.service");
const auth_middleware_1 = require("../auth/auth.middleware");
const validate_1 = require("../../shared/middleware/validate");
const response_1 = require("../../shared/utils/response");
const socketEvents_1 = require("../../shared/constants/socketEvents");
// /rooms/:roomId/queue
const createQueueRouter = (io) => {
    const router = (0, express_1.Router)({ mergeParams: true });
    const respondWithQueue = (res, roomId, queue, status = 200) => {
        io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.QUEUE_UPDATE, queue);
        (0, response_1.sendSuccess)(res, queue, status);
    };
    const respondWithPlayed = (res, roomId, result) => {
        io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.VIDEO_UPDATE, result.video);
        io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.QUEUE_UPDATE, result.queue);
        (0, response_1.sendSuccess)(res, result);
    };
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
    router.get('/', auth_middleware_1.requireMember, (_req, res) => {
        (0, response_1.sendSuccess)(res, queue_service_1.queueService.getQueue((0, auth_middleware_1.getRoom)(res).id));
    });
    router.post('/', auth_middleware_1.requireHost, (0, validate_1.validate)([
        { field: 'url', type: 'string', required: true, minLength: 1 },
        { field: 'title', type: 'string' },
    ]), (req, res) => {
        const roomId = (0, auth_middleware_1.getRoom)(res).id;
        respondWithQueue(res, roomId, queue_service_1.queueService.add(roomId, req.body.url, req.body.title), 201);
    });
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
    router.patch('/next', auth_middleware_1.requireHost, (_req, res) => {
        const roomId = (0, auth_middleware_1.getRoom)(res).id;
        const result = queue_service_1.queueService.next(roomId);
        if (!result) {
            (0, response_1.sendError)(res, 'Очередь пуста', 'VALIDATION_ERROR', 400);
            return;
        }
        respondWithPlayed(res, roomId, result);
    });
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
    router.patch('/reorder', auth_middleware_1.requireHost, (0, validate_1.validate)([
        { field: 'fromIndex', type: 'integer', required: true },
        { field: 'toIndex', type: 'integer', required: true },
    ]), (req, res) => {
        const roomId = (0, auth_middleware_1.getRoom)(res).id;
        const queue = queue_service_1.queueService.reorder(roomId, req.body.fromIndex, req.body.toIndex);
        if (!queue) {
            (0, response_1.sendValidationError)(res, 'Некорректные индексы');
            return;
        }
        respondWithQueue(res, roomId, queue);
    });
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
    router.delete('/:itemId', auth_middleware_1.requireHost, (req, res) => {
        const roomId = (0, auth_middleware_1.getRoom)(res).id;
        respondWithQueue(res, roomId, queue_service_1.queueService.remove(roomId, String(req.params.itemId)));
    });
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
    router.patch('/:itemId/play', auth_middleware_1.requireHost, (req, res) => {
        const roomId = (0, auth_middleware_1.getRoom)(res).id;
        const result = queue_service_1.queueService.play(roomId, String(req.params.itemId));
        if (!result) {
            (0, response_1.sendNotFound)(res, 'Элемент не найден');
            return;
        }
        respondWithPlayed(res, roomId, result);
    });
    return router;
};
exports.createQueueRouter = createQueueRouter;
