"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.snapshotRouter = void 0;
const express_1 = require("express");
const snapshot_service_1 = require("./snapshot.service");
const auth_middleware_1 = require("../auth/auth.middleware");
const response_1 = require("../../shared/utils/response");
// /rooms/:roomId/state
exports.snapshotRouter = (0, express_1.Router)({ mergeParams: true });
/**
 * @swagger
 * /rooms/{roomId}/state:
 *   get:
 *     summary: Снимок состояния комнаты
 *     description: Клиент запрашивает его при каждом подключении сокета.
 *     tags: [Rooms]
 *     security: [{ MemberToken: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/RoomId'
 *     responses:
 *       200:
 *         description: Снимок комнаты
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/RoomSnapshot' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
exports.snapshotRouter.get('/', auth_middleware_1.requireMember, (_req, res) => {
    (0, response_1.sendSuccess)(res, snapshot_service_1.snapshotService.build((0, auth_middleware_1.getRoom)(res), (0, auth_middleware_1.getMember)(res).userId));
});
