"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomUsersRouter = void 0;
const express_1 = require("express");
const state_1 = require("../state/state");
const response_1 = require("../../shared/utils/response");
const router = (0, express_1.Router)({ mergeParams: true });
exports.roomUsersRouter = router;
/**
 * @swagger
 * /rooms/{roomId}/users:
 *   get:
 *     summary: Получить список пользователей комнаты
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         example: ABC123
 *     responses:
 *       200:
 *         description: Список пользователей и статус готовности
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
 *                         users:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/RoomUser'
 *                         hostId:
 *                           type: string
 *                           nullable: true
 *                         readyUsers:
 *                           type: array
 *                           items:
 *                             type: string
 *       404:
 *         description: Комната не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/', (req, res) => {
    const roomId = req.params.roomId.toUpperCase();
    if (!state_1.state.rooms.get(roomId)) {
        (0, response_1.sendError)(res, 'Комната не найдена', 'NOT_FOUND', 404);
        return;
    }
    const users = state_1.state.getRoomUsers(roomId);
    const hostId = state_1.state.roomHosts.get(roomId) ?? null;
    const readyUsers = state_1.state.getRoomReadyUsers(roomId);
    (0, response_1.sendSuccess)(res, { users, hostId, readyUsers });
});
