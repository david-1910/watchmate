"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const response_1 = require("../utils/response");
const validate = (rules) => (req, res, next) => {
    for (const rule of rules) {
        const value = req.body?.[rule.field];
        const missing = value === undefined || value === null || value === '';
        if (rule.required && missing) {
            (0, response_1.sendError)(res, `Поле "${rule.field}" обязательно`, 'VALIDATION_ERROR', 400);
            return;
        }
        if (!missing) {
            if (rule.type === 'string' && typeof value !== 'string') {
                (0, response_1.sendError)(res, `Поле "${rule.field}" должно быть строкой`, 'VALIDATION_ERROR', 400);
                return;
            }
            if (rule.type === 'boolean' && typeof value !== 'boolean') {
                (0, response_1.sendError)(res, `Поле "${rule.field}" должно быть булевым`, 'VALIDATION_ERROR', 400);
                return;
            }
            if (rule.type === 'string' && rule.minLength && value.trim().length < rule.minLength) {
                (0, response_1.sendError)(res, `Поле "${rule.field}" слишком короткое`, 'VALIDATION_ERROR', 400);
                return;
            }
        }
    }
    next();
};
exports.validate = validate;
