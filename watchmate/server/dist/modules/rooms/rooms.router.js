"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomsRouter = void 0;
const express_1 = require("express");
const rooms_service_1 = require("./rooms.service");
const validate_1 = require("../../shared/middleware/validate");
const response_1 = require("../../shared/utils/response");
const router = (0, express_1.Router)();
exports.roomsRouter = router;
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
router.post('/', (0, validate_1.validate)([
    { field: 'isPrivate', type: 'boolean' },
    { field: 'password', type: 'string', minLength: 1 },
]), (req, res) => {
    const { isPrivate = false, password } = req.body ?? {};
    if (isPrivate && !password?.trim()) {
        (0, response_1.sendError)(res, 'Пароль обязателен для приватной комнаты', 'VALIDATION_ERROR', 400);
        return;
    }
    const room = rooms_service_1.roomsService.create({ isPrivate: !!isPrivate, password });
    (0, response_1.sendSuccess)(res, room, 201);
});
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
router.get('/:id', (req, res) => {
    const id = req.params.id;
    const room = rooms_service_1.roomsService.findById(id);
    if (!room) {
        (0, response_1.sendError)(res, 'Комната не найдена', 'NOT_FOUND', 404);
        return;
    }
    (0, response_1.sendSuccess)(res, { id: room.id, createdAt: room.createdAt, isPrivate: room.isPrivate });
});
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
router.post('/:id/verify', (0, validate_1.validate)([{ field: 'password', type: 'string', required: true, minLength: 1 }]), (req, res) => {
    const id = req.params.id;
    const { password } = req.body;
    const room = rooms_service_1.roomsService.findById(id);
    if (!room) {
        (0, response_1.sendError)(res, 'Комната не найдена', 'NOT_FOUND', 404);
        return;
    }
    if (rooms_service_1.roomsService.verifyPassword(id, password)) {
        (0, response_1.sendSuccess)(res, { verified: true });
    }
    else {
        (0, response_1.sendError)(res, 'Неверный пароль', 'UNAUTHORIZED', 401);
    }
});
