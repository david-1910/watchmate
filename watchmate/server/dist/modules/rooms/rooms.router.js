"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoomsRouter = void 0;
const express_1 = require("express");
const rooms_service_1 = require("./rooms.service");
const auth_middleware_1 = require("../auth/auth.middleware");
const validate_1 = require("../../shared/middleware/validate");
const rateLimit_1 = require("../../shared/middleware/rateLimit");
const response_1 = require("../../shared/utils/response");
const socketEvents_1 = require("../../shared/constants/socketEvents");
const createRoomsRouter = (io) => {
    const router = (0, express_1.Router)();
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
     *               isPrivate: { type: boolean, default: false }
     *               password: { type: string, description: 'Обязателен, если isPrivate = true' }
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
     *                     data: { $ref: '#/components/schemas/CreatedRoom' }
     *       400: { $ref: '#/components/responses/ValidationError' }
     *       429: { $ref: '#/components/responses/RateLimit' }
     */
    router.post('/', rateLimit_1.createRoomLimiter, (0, validate_1.validate)([
        { field: 'isPrivate', type: 'boolean' },
        { field: 'password', type: 'string', minLength: 1 },
    ]), (req, res) => {
        const { isPrivate = false, password } = req.body ?? {};
        if (isPrivate && !password?.trim()) {
            (0, response_1.sendValidationError)(res, 'Пароль обязателен для приватной комнаты');
            return;
        }
        (0, response_1.sendSuccess)(res, rooms_service_1.roomsService.create({ isPrivate, password }), 201);
    });
    /**
     * @swagger
     * /rooms/by-code/{code}:
     *   get:
     *     summary: Найти комнату по коду входа
     *     description: 'Код нормализуется: верхний регистр, без дефисов и пробелов.'
     *     tags: [Rooms]
     *     parameters:
     *       - { in: path, name: code, required: true, schema: { type: string, example: ABC-234 } }
     *     responses:
     *       200:
     *         description: Комната найдена
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiSuccess'
     *                 - type: object
     *                   properties:
     *                     data: { $ref: '#/components/schemas/RoomInfo' }
     *       404: { $ref: '#/components/responses/NotFound' }
     *       429: { $ref: '#/components/responses/RateLimit' }
     */
    router.get('/by-code/:code', rateLimit_1.codeLookupLimiter, (req, res) => {
        const room = rooms_service_1.roomsService.findByCode(String(req.params.code));
        if (!room) {
            (0, response_1.sendNotFound)(res, 'Комната не найдена');
            return;
        }
        (0, response_1.sendSuccess)(res, { id: room.id, isPrivate: room.isPrivate });
    });
    /**
     * @swagger
     * /rooms/{roomId}:
     *   get:
     *     summary: Получить информацию о комнате
     *     tags: [Rooms]
     *     parameters:
     *       - $ref: '#/components/parameters/RoomId'
     *     responses:
     *       200:
     *         description: Комната найдена
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiSuccess'
     *                 - type: object
     *                   properties:
     *                     data: { $ref: '#/components/schemas/RoomInfo' }
     *       404: { $ref: '#/components/responses/NotFound' }
     */
    router.get('/:roomId', auth_middleware_1.requireRoom, (_req, res) => {
        const room = (0, auth_middleware_1.getRoom)(res);
        (0, response_1.sendSuccess)(res, { id: room.id, isPrivate: room.isPrivate });
    });
    /**
     * @swagger
     * /rooms/{roomId}/code:
     *   post:
     *     summary: Сменить код входа (только хост)
     *     description: Старый код перестаёт работать сразу. Рассылает room-update.
     *     tags: [Rooms]
     *     security: [{ MemberToken: [] }]
     *     parameters:
     *       - $ref: '#/components/parameters/RoomId'
     *     responses:
     *       200:
     *         description: Новый код
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiSuccess'
     *                 - type: object
     *                   properties:
     *                     data: { type: object, properties: { joinCode: { type: string } } }
     *       401: { $ref: '#/components/responses/Unauthorized' }
     *       403: { $ref: '#/components/responses/Forbidden' }
     *       404: { $ref: '#/components/responses/NotFound' }
     */
    router.post('/:roomId/code', auth_middleware_1.requireHost, (_req, res) => {
        const room = (0, auth_middleware_1.getRoom)(res);
        const joinCode = rooms_service_1.roomsService.regenerateJoinCode(room);
        io.to(room.id).emit(socketEvents_1.SOCKET_EVENTS.ROOM_UPDATE, { joinCode });
        (0, response_1.sendSuccess)(res, { joinCode });
    });
    return router;
};
exports.createRoomsRouter = createRoomsRouter;
