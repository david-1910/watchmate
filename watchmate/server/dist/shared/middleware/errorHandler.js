"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFoundHandler = void 0;
const response_1 = require("../utils/response");
const notFoundHandler = (req, res) => {
    (0, response_1.sendError)(res, `Маршрут ${req.method} ${req.path} не найден`, 'NOT_FOUND', 404);
};
exports.notFoundHandler = notFoundHandler;
const errorHandler = (err, _req, res, _next) => {
    console.error('[ERROR]', err.message);
    (0, response_1.sendError)(res, 'Внутренняя ошибка сервера', 'INTERNAL_ERROR', 500);
};
exports.errorHandler = errorHandler;
