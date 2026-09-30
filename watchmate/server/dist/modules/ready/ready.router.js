"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReadyRouter = void 0;
const express_1 = require("express");
const ready_service_1 = require("./ready.service");
const ready_countdown_1 = require("./ready.countdown");
const auth_middleware_1 = require("../auth/auth.middleware");
const host_service_1 = require("../members/host.service");
const response_1 = require("../../shared/utils/response");
const socketEvents_1 = require("../../shared/constants/socketEvents");
// /rooms/:roomId/ready
const createReadyRouter = (io) => {
    const router = (0, express_1.Router)({ mergeParams: true });
    /**
     * @swagger
     * /rooms/{roomId}/ready/toggle:
     *   post:
     *     summary: Переключить готовность (только зритель)
     *     description: Рассылает ready-update. Хост готов по умолчанию и в подсчёте не участвует. Отсчёт сам не запускается — его запускает хост через /ready/start.
     *     tags: [Ready]
     *     security: [{ MemberToken: [] }]
     *     parameters:
     *       - $ref: '#/components/parameters/RoomId'
     *     responses:
     *       200:
     *         description: Состояние готовности
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiSuccess'
     *                 - type: object
     *                   properties:
     *                     data: { $ref: '#/components/schemas/ReadyState' }
     *       401: { $ref: '#/components/responses/Unauthorized' }
     *       403: { $ref: '#/components/responses/Forbidden' }
     *       404: { $ref: '#/components/responses/NotFound' }
     */
    router.post('/toggle', auth_middleware_1.requireMember, (_req, res) => {
        const roomId = (0, auth_middleware_1.getRoom)(res).id;
        const { userId } = (0, auth_middleware_1.getMember)(res);
        if (host_service_1.hostService.isHost(roomId, userId)) {
            (0, response_1.sendError)(res, 'Хост готов по умолчанию', 'FORBIDDEN', 403);
            return;
        }
        const ready = ready_service_1.readyService.toggle(roomId, userId);
        io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.READY_UPDATE, ready);
        (0, response_1.sendSuccess)(res, ready);
    });
    /**
     * @swagger
     * /rooms/{roomId}/ready/start:
     *   post:
     *     summary: Начать просмотр (только хост)
     *     description: Когда все онлайн-зрители готовы, запускает countdown 3→0, после чего готовность сбрасывается (ready-update).
     *     tags: [Ready]
     *     security: [{ MemberToken: [] }]
     *     parameters:
     *       - $ref: '#/components/parameters/RoomId'
     *     responses:
     *       200:
     *         description: Отсчёт запущен
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiSuccess'
     *                 - type: object
     *                   properties:
     *                     data: { type: object, properties: { started: { type: boolean } } }
     *       400: { $ref: '#/components/responses/ValidationError' }
     *       401: { $ref: '#/components/responses/Unauthorized' }
     *       403: { $ref: '#/components/responses/Forbidden' }
     *       404: { $ref: '#/components/responses/NotFound' }
     */
    router.post('/start', auth_middleware_1.requireHost, (_req, res) => {
        const roomId = (0, auth_middleware_1.getRoom)(res).id;
        const result = ready_service_1.readyService.start(roomId);
        if (result === 'not-ready') {
            (0, response_1.sendError)(res, 'Не все зрители готовы', 'VALIDATION_ERROR', 400);
            return;
        }
        if (result === 'running') {
            (0, response_1.sendError)(res, 'Отсчёт уже идёт', 'VALIDATION_ERROR', 400);
            return;
        }
        (0, ready_countdown_1.emitCountdown)(io, roomId);
        (0, response_1.sendSuccess)(res, { started: true });
    });
    return router;
};
exports.createReadyRouter = createReadyRouter;
