"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChatRouter = void 0;
const express_1 = require("express");
const chat_service_1 = require("./chat.service");
const auth_middleware_1 = require("../auth/auth.middleware");
const validate_1 = require("../../shared/middleware/validate");
const response_1 = require("../../shared/utils/response");
const socketEvents_1 = require("../../shared/constants/socketEvents");
const limits_1 = require("../../shared/constants/limits");
// afterSeq — неотрицательное целое, по умолчанию 0; null — невалидное значение
const parseAfterSeq = (raw) => {
    if (raw === undefined)
        return 0;
    const value = Number(raw);
    return typeof raw === 'string' && raw !== '' && Number.isInteger(value) && value >= 0 ? value : null;
};
// /rooms/:roomId/messages
const createChatRouter = (io) => {
    const router = (0, express_1.Router)({ mergeParams: true });
    /**
     * @swagger
     * /rooms/{roomId}/messages:
     *   get:
     *     summary: Сообщения после afterSeq (от старых к новым)
     *     tags: [Chat]
     *     security: [{ MemberToken: [] }]
     *     parameters:
     *       - $ref: '#/components/parameters/RoomId'
     *       - { in: query, name: afterSeq, schema: { type: integer, minimum: 0, default: 0 } }
     *     responses:
     *       200:
     *         description: Сообщения с seq > afterSeq
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
     *                         messages: { type: array, items: { $ref: '#/components/schemas/ChatMessage' } }
     *                         lastSeq: { type: integer }
     *       400: { $ref: '#/components/responses/ValidationError' }
     *       401: { $ref: '#/components/responses/Unauthorized' }
     *       404: { $ref: '#/components/responses/NotFound' }
     */
    router.get('/', auth_middleware_1.requireMember, (req, res) => {
        const afterSeq = parseAfterSeq(req.query.afterSeq);
        if (afterSeq === null) {
            (0, response_1.sendValidationError)(res, 'Параметр "afterSeq" должен быть неотрицательным целым числом');
            return;
        }
        (0, response_1.sendSuccess)(res, chat_service_1.chatService.getMessages((0, auth_middleware_1.getRoom)(res).id, afterSeq));
    });
    /**
     * @swagger
     * /rooms/{roomId}/messages:
     *   post:
     *     summary: Отправить сообщение
     *     description: Идемпотентно по clientId. Новое сообщение рассылается как message-new всей комнате, включая отправителя; повтор возвращает существующее без рассылки.
     *     tags: [Chat]
     *     security: [{ MemberToken: [] }]
     *     parameters:
     *       - $ref: '#/components/parameters/RoomId'
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [clientId, message]
     *             properties:
     *               clientId: { type: string, format: uuid }
     *               message: { type: string, maxLength: 500 }
     *     responses:
     *       200:
     *         description: Повтор clientId — существующее сообщение
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiSuccess'
     *                 - type: object
     *                   properties:
     *                     data: { $ref: '#/components/schemas/ChatMessage' }
     *       201:
     *         description: Сообщение сохранено
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiSuccess'
     *                 - type: object
     *                   properties:
     *                     data: { $ref: '#/components/schemas/ChatMessage' }
     *       400: { $ref: '#/components/responses/ValidationError' }
     *       401: { $ref: '#/components/responses/Unauthorized' }
     *       404: { $ref: '#/components/responses/NotFound' }
     */
    router.post('/', auth_middleware_1.requireMember, (0, validate_1.validate)([
        { field: 'clientId', type: 'uuid', required: true },
        { field: 'message', type: 'string', required: true, minLength: 1, maxLength: limits_1.MESSAGE_MAX_LENGTH },
    ]), (req, res) => {
        const roomId = (0, auth_middleware_1.getRoom)(res).id;
        const { userId, userName } = (0, auth_middleware_1.getMember)(res);
        const { clientId, message } = req.body;
        const result = chat_service_1.chatService.post(roomId, { clientId, message, userId, userName });
        if (result.created)
            io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.MESSAGE_NEW, result.message);
        (0, response_1.sendSuccess)(res, result.message, result.created ? 201 : 200);
    });
    return router;
};
exports.createChatRouter = createChatRouter;
