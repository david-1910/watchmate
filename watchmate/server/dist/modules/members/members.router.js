"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hostRouter = exports.membersRouter = void 0;
const express_1 = require("express");
const members_service_1 = require("./members.service");
const host_service_1 = require("./host.service");
const auth_middleware_1 = require("../auth/auth.middleware");
const validate_1 = require("../../shared/middleware/validate");
const rateLimit_1 = require("../../shared/middleware/rateLimit");
const response_1 = require("../../shared/utils/response");
const limits_1 = require("../../shared/constants/limits");
// /rooms/:roomId/members
exports.membersRouter = (0, express_1.Router)({ mergeParams: true });
/**
 * @swagger
 * /rooms/{roomId}/members:
 *   post:
 *     summary: Войти в комнату (создать участника)
 *     description: |
 *       Приватная комната всегда требует верный password; верный hostToken пропускает проверку пароля.
 *       hostToken делает участника хостом, только если хоста нет или он офлайн.
 *     tags: [Members]
 *     parameters:
 *       - $ref: '#/components/parameters/RoomId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userName]
 *             properties:
 *               userName: { type: string, maxLength: 30 }
 *               password: { type: string }
 *               hostToken: { type: string }
 *     responses:
 *       201:
 *         description: Участник создан
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/JoinedMember' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/WrongPassword' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       429: { $ref: '#/components/responses/RateLimit' }
 */
exports.membersRouter.post('/', rateLimit_1.joinLimiter, auth_middleware_1.requireRoom, (0, validate_1.validate)([
    { field: 'userName', type: 'string', required: true, minLength: 1, maxLength: limits_1.USERNAME_MAX_LENGTH },
    { field: 'password', type: 'string' },
    { field: 'hostToken', type: 'string' },
]), (req, res) => {
    const { userName, password, hostToken } = req.body;
    const result = members_service_1.membersService.join((0, auth_middleware_1.getRoom)(res), { userName, password, hostToken });
    if (!result) {
        (0, response_1.sendError)(res, 'Неверный пароль', 'WRONG_PASSWORD', 401);
        return;
    }
    (0, response_1.sendSuccess)(res, result, 201);
});
/**
 * @swagger
 * /rooms/{roomId}/members/me:
 *   delete:
 *     summary: Выйти из комнаты
 *     description: Участник удаляется сразу; если это хост, роль передаётся сразу.
 *     tags: [Members]
 *     security: [{ MemberToken: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/RoomId'
 *     responses:
 *       200:
 *         description: Участник удалён
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { type: object, properties: { left: { type: boolean, example: true } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
exports.membersRouter.delete('/me', auth_middleware_1.requireMember, (_req, res) => {
    members_service_1.membersService.leave((0, auth_middleware_1.getRoom)(res).id, (0, auth_middleware_1.getMember)(res).userId);
    (0, response_1.sendSuccess)(res, { left: true });
});
// /rooms/:roomId/host
exports.hostRouter = (0, express_1.Router)({ mergeParams: true });
/**
 * @swagger
 * /rooms/{roomId}/host:
 *   post:
 *     summary: Передать роль хоста онлайн-участнику (только хост)
 *     description: Рассылает host-update.
 *     tags: [Members]
 *     security: [{ MemberToken: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/RoomId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Роль передана
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { type: object, properties: { hostId: { type: string } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
exports.hostRouter.post('/', auth_middleware_1.requireHost, (0, validate_1.validate)([{ field: 'userId', type: 'uuid', required: true }]), (req, res) => {
    const { userId } = req.body;
    const result = host_service_1.hostService.transfer((0, auth_middleware_1.getRoom)(res).id, userId);
    if (result === 'not-found') {
        (0, response_1.sendNotFound)(res, 'Участник не найден');
        return;
    }
    if (result === 'offline') {
        (0, response_1.sendValidationError)(res, 'Участник не в сети');
        return;
    }
    (0, response_1.sendSuccess)(res, { hostId: userId });
});
