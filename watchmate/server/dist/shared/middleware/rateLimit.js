"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.codeLookupLimiter = exports.joinLimiter = exports.createRoomLimiter = exports.globalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Лимиты из CONTRACT.md, раздел 3. IP клиента за прокси — через app.set('trust proxy')
const rateLimitMessage = (message) => ({
    success: false,
    error: { message, code: 'RATE_LIMIT' },
});
const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;
exports.globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: FIFTEEN_MINUTES,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: rateLimitMessage('Слишком много запросов'),
});
exports.createRoomLimiter = (0, express_rate_limit_1.default)({
    windowMs: ONE_HOUR,
    max: 10,
    message: rateLimitMessage('Слишком много комнат создано'),
});
exports.joinLimiter = (0, express_rate_limit_1.default)({
    windowMs: FIFTEEN_MINUTES,
    max: 10,
    skipSuccessfulRequests: true,
    message: rateLimitMessage('Слишком много попыток входа'),
});
exports.codeLookupLimiter = (0, express_rate_limit_1.default)({
    windowMs: FIFTEEN_MINUTES,
    max: 20,
    skipSuccessfulRequests: true,
    message: rateLimitMessage('Слишком много попыток ввода кода'),
});
