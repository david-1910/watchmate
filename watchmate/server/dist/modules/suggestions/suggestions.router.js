"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSuggestionsRouter = void 0;
const express_1 = require("express");
const suggestions_service_1 = require("./suggestions.service");
const auth_1 = require("../../shared/middleware/auth");
const validate_1 = require("../../shared/middleware/validate");
const response_1 = require("../../shared/utils/response");
const socketEvents_1 = require("../../shared/constants/socketEvents");
const state_1 = require("../state/state");
const createSuggestionsRouter = (io) => {
    const router = (0, express_1.Router)({ mergeParams: true });
    /**
     * @swagger
     * /rooms/{roomId}/suggestions:
     *   get:
     *     summary: Получить список предложений
     *     tags: [Suggestions]
     *     parameters:
     *       - in: path
     *         name: roomId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Список предложений
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
     *                         $ref: '#/components/schemas/Suggestion'
     */
    router.get('/', (req, res) => {
        const roomId = req.params.roomId.toUpperCase();
        (0, response_1.sendSuccess)(res, suggestions_service_1.suggestionsService.getSuggestions(roomId));
    });
    /**
     * @swagger
     * /rooms/{roomId}/suggestions:
     *   post:
     *     summary: Предложить видео
     *     tags: [Suggestions]
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
     *             required: [url, userName]
     *             properties:
     *               url:
     *                 type: string
     *               title:
     *                 type: string
     *               userName:
     *                 type: string
     *     responses:
     *       201:
     *         description: Предложение добавлено
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
     *                         $ref: '#/components/schemas/Suggestion'
     *       404:
     *         description: Комната не найдена
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiError'
     */
    router.post('/', (0, validate_1.validate)([
        { field: 'url', type: 'string', required: true, minLength: 1 },
        { field: 'title', type: 'string' },
        { field: 'userName', type: 'string', required: true, minLength: 1 },
    ]), (req, res) => {
        const roomId = req.params.roomId.toUpperCase();
        const { url, title, userName } = req.body;
        if (!state_1.state.rooms.get(roomId)) {
            (0, response_1.sendError)(res, 'Комната не найдена', 'NOT_FOUND', 404);
            return;
        }
        const suggestions = suggestions_service_1.suggestionsService.suggest(roomId, url, title, userName, 'rest-client');
        io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.SUGGESTIONS_UPDATE, suggestions);
        (0, response_1.sendSuccess)(res, suggestions, 201);
    });
    /**
     * @swagger
     * /rooms/{roomId}/suggestions/{suggestionId}/accept:
     *   patch:
     *     summary: Принять предложение (только хост)
     *     tags: [Suggestions]
     *     security:
     *       - HostToken: []
     *     parameters:
     *       - in: path
     *         name: roomId
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: suggestionId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Предложение принято и добавлено в очередь
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiSuccess'
     *       404:
     *         description: Предложение не найдено
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
    router.patch('/:suggestionId/accept', auth_1.requireHost, (req, res) => {
        const roomId = req.params.roomId.toUpperCase();
        const result = suggestions_service_1.suggestionsService.accept(roomId, req.params.suggestionId);
        if (!result) {
            (0, response_1.sendError)(res, 'Предложение не найдено', 'NOT_FOUND', 404);
            return;
        }
        io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.QUEUE_UPDATE, result.queue);
        io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.SUGGESTIONS_UPDATE, result.suggestions);
        (0, response_1.sendSuccess)(res, result);
    });
    /**
     * @swagger
     * /rooms/{roomId}/suggestions/{suggestionId}:
     *   delete:
     *     summary: Отклонить предложение (только хост)
     *     tags: [Suggestions]
     *     security:
     *       - HostToken: []
     *     parameters:
     *       - in: path
     *         name: roomId
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: suggestionId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Предложение отклонено
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
     *                         $ref: '#/components/schemas/Suggestion'
     *       403:
     *         description: Только хост
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiError'
     */
    router.delete('/:suggestionId', auth_1.requireHost, (req, res) => {
        const roomId = req.params.roomId.toUpperCase();
        const suggestions = suggestions_service_1.suggestionsService.reject(roomId, req.params.suggestionId);
        io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.SUGGESTIONS_UPDATE, suggestions);
        (0, response_1.sendSuccess)(res, suggestions);
    });
    return router;
};
exports.createSuggestionsRouter = createSuggestionsRouter;
