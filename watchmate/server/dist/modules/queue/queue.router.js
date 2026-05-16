"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQueueRouter = void 0;
const express_1 = require("express");
const queue_service_1 = require("./queue.service");
const auth_1 = require("../../shared/middleware/auth");
const validate_1 = require("../../shared/middleware/validate");
const response_1 = require("../../shared/utils/response");
const socketEvents_1 = require("../../shared/constants/socketEvents");
const createQueueRouter = (io) => {
    const router = (0, express_1.Router)({ mergeParams: true });
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
    router.get('/', (req, res) => {
        const roomId = req.params.roomId.toUpperCase();
        (0, response_1.sendSuccess)(res, queue_service_1.queueService.getQueue(roomId));
    });
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
    router.post('/', auth_1.requireHost, (0, validate_1.validate)([
        { field: 'url', type: 'string', required: true, minLength: 1 },
        { field: 'title', type: 'string' },
    ]), (req, res) => {
        const roomId = req.params.roomId.toUpperCase();
        const { url, title } = req.body;
        const queue = queue_service_1.queueService.add(roomId, url, title);
        io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.QUEUE_UPDATE, queue);
        (0, response_1.sendSuccess)(res, queue, 201);
    });
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
    router.delete('/:itemId', auth_1.requireHost, (req, res) => {
        const roomId = req.params.roomId.toUpperCase();
        const queue = queue_service_1.queueService.remove(roomId, req.params.itemId);
        io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.QUEUE_UPDATE, queue);
        (0, response_1.sendSuccess)(res, queue);
    });
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
    router.patch('/next', auth_1.requireHost, (req, res) => {
        const roomId = req.params.roomId.toUpperCase();
        const result = queue_service_1.queueService.next(roomId);
        if (!result) {
            (0, response_1.sendError)(res, 'Очередь пуста', 'QUEUE_EMPTY', 400);
            return;
        }
        io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.QUEUE_UPDATE, result.queue);
        io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.VIDEO_UPDATE, result.url);
        (0, response_1.sendSuccess)(res, result);
    });
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
    router.patch('/:itemId/play', auth_1.requireHost, (req, res) => {
        const roomId = req.params.roomId.toUpperCase();
        const result = queue_service_1.queueService.play(roomId, req.params.itemId);
        if (!result) {
            (0, response_1.sendError)(res, 'Элемент не найден', 'NOT_FOUND', 404);
            return;
        }
        io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.QUEUE_UPDATE, result.queue);
        io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.VIDEO_UPDATE, result.url);
        (0, response_1.sendSuccess)(res, result);
    });
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
    router.patch('/reorder', auth_1.requireHost, (0, validate_1.validate)([
        { field: 'fromIndex', type: 'string' },
        { field: 'toIndex', type: 'string' },
    ]), (req, res) => {
        const roomId = req.params.roomId.toUpperCase();
        const fromIndex = Number(req.body.fromIndex);
        const toIndex = Number(req.body.toIndex);
        const queue = queue_service_1.queueService.reorder(roomId, fromIndex, toIndex);
        if (!queue) {
            (0, response_1.sendError)(res, 'Некорректные индексы', 'VALIDATION_ERROR', 400);
            return;
        }
        io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.QUEUE_UPDATE, queue);
        (0, response_1.sendSuccess)(res, queue);
    });
    return router;
};
exports.createQueueRouter = createQueueRouter;
