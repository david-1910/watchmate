"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFoundHandler = void 0;
const response_1 = require("../utils/response");
// Ошибки разбора тела запроса из express.json
const BODY_ERRORS = new Set(['entity.parse.failed', 'entity.too.large']);
const notFoundHandler = (req, res) => {
    (0, response_1.sendNotFound)(res, `Маршрут ${req.method} ${req.path} не найден`);
};
exports.notFoundHandler = notFoundHandler;
const errorHandler = (err, _req, res, _next) => {
    if (err.type && BODY_ERRORS.has(err.type)) {
        (0, response_1.sendValidationError)(res, 'Некорректное тело запроса');
        return;
    }
    console.error('[ERROR]', err.message);
    (0, response_1.sendError)(res, 'Внутренняя ошибка сервера', 'INTERNAL_ERROR', 500);
};
exports.errorHandler = errorHandler;
