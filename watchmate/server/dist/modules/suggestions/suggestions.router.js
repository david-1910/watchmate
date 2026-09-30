"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSuggestionsRouter = void 0;
const express_1 = require("express");
const suggestions_service_1 = require("./suggestions.service");
const auth_middleware_1 = require("../auth/auth.middleware");
const validate_1 = require("../../shared/middleware/validate");
const response_1 = require("../../shared/utils/response");
const socketEvents_1 = require("../../shared/constants/socketEvents");
// /rooms/:roomId/suggestions
const createSuggestionsRouter = (io) => {
    const router = (0, express_1.Router)({ mergeParams: true });
    const respondWithSuggestions = (res, roomId, suggestions, status = 200) => {
        io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.SUGGESTIONS_UPDATE, suggestions);
        (0, response_1.sendSuccess)(res, suggestions, status);
    };
    /**
     * @swagger
     * /rooms/{roomId}/suggestions:
     *   get:
     *     summary: Получить предложения
     *     tags: [Suggestions]
     *     security: [{ MemberToken: [] }]
     *     parameters:
     *       - $ref: '#/components/parameters/RoomId'
     *     responses:
     *       200: { $ref: '#/components/responses/Suggestions' }
     *       401: { $ref: '#/components/responses/Unauthorized' }
     *       404: { $ref: '#/components/responses/NotFound' }
     *   post:
     *     summary: Предложить видео
     *     description: Рассылает suggestions-update. suggestedById — userId участника.
     *     tags: [Suggestions]
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
     *       201: { $ref: '#/components/responses/Suggestions' }
     *       400: { $ref: '#/components/responses/ValidationError' }
     *       401: { $ref: '#/components/responses/Unauthorized' }
     *       404: { $ref: '#/components/responses/NotFound' }
     */
    router.get('/', auth_middleware_1.requireMember, (_req, res) => {
        (0, response_1.sendSuccess)(res, suggestions_service_1.suggestionsService.getSuggestions((0, auth_middleware_1.getRoom)(res).id));
    });
    router.post('/', auth_middleware_1.requireMember, (0, validate_1.validate)([
        { field: 'url', type: 'string', required: true, minLength: 1 },
        { field: 'title', type: 'string' },
    ]), (req, res) => {
        const roomId = (0, auth_middleware_1.getRoom)(res).id;
        const { userId, userName } = (0, auth_middleware_1.getMember)(res);
        const suggestions = suggestions_service_1.suggestionsService.suggest(roomId, { url: req.body.url, title: req.body.title, userName, userId });
        respondWithSuggestions(res, roomId, suggestions, 201);
    });
    /**
     * @swagger
     * /rooms/{roomId}/suggestions/{id}/accept:
     *   patch:
     *     summary: Принять предложение в очередь (только хост)
     *     description: Рассылает queue-update и suggestions-update.
     *     tags: [Suggestions]
     *     security: [{ MemberToken: [] }]
     *     parameters:
     *       - $ref: '#/components/parameters/RoomId'
     *       - { in: path, name: id, required: true, schema: { type: string } }
     *     responses:
     *       200:
     *         description: Предложение принято
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
     *                         queue: { type: array, items: { $ref: '#/components/schemas/QueueItem' } }
     *                         suggestions: { type: array, items: { $ref: '#/components/schemas/Suggestion' } }
     *       401: { $ref: '#/components/responses/Unauthorized' }
     *       403: { $ref: '#/components/responses/Forbidden' }
     *       404: { $ref: '#/components/responses/NotFound' }
     */
    router.patch('/:id/accept', auth_middleware_1.requireHost, (req, res) => {
        const roomId = (0, auth_middleware_1.getRoom)(res).id;
        const result = suggestions_service_1.suggestionsService.accept(roomId, String(req.params.id));
        if (!result) {
            (0, response_1.sendNotFound)(res, 'Предложение не найдено');
            return;
        }
        io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.QUEUE_UPDATE, result.queue);
        io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.SUGGESTIONS_UPDATE, result.suggestions);
        (0, response_1.sendSuccess)(res, { queue: result.queue, suggestions: result.suggestions });
    });
    /**
     * @swagger
     * /rooms/{roomId}/suggestions/{id}:
     *   delete:
     *     summary: Отклонить предложение (только хост)
     *     description: Рассылает suggestions-update.
     *     tags: [Suggestions]
     *     security: [{ MemberToken: [] }]
     *     parameters:
     *       - $ref: '#/components/parameters/RoomId'
     *       - { in: path, name: id, required: true, schema: { type: string } }
     *     responses:
     *       200: { $ref: '#/components/responses/Suggestions' }
     *       401: { $ref: '#/components/responses/Unauthorized' }
     *       403: { $ref: '#/components/responses/Forbidden' }
     *       404: { $ref: '#/components/responses/NotFound' }
     */
    router.delete('/:id', auth_middleware_1.requireHost, (req, res) => {
        const roomId = (0, auth_middleware_1.getRoom)(res).id;
        respondWithSuggestions(res, roomId, suggestions_service_1.suggestionsService.reject(roomId, String(req.params.id)));
    });
    return router;
};
exports.createSuggestionsRouter = createSuggestionsRouter;
