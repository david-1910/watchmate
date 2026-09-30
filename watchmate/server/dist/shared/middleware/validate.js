"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const response_1 = require("../utils/response");
const validators_1 = require("../utils/validators");
const TYPE_CHECKS = {
    string: { check: (v) => typeof v === 'string', label: 'строкой' },
    boolean: { check: (v) => typeof v === 'boolean', label: 'булевым' },
    integer: { check: (v) => Number.isInteger(v), label: 'целым числом' },
    uuid: { check: validators_1.isUuid, label: 'UUID' },
};
const fail = (res, message) => (0, response_1.sendError)(res, message, 'VALIDATION_ERROR', 400);
const validate = (rules) => (req, res, next) => {
    for (const rule of rules) {
        const value = req.body?.[rule.field];
        const missing = value === undefined || value === null || value === '';
        if (missing) {
            if (rule.required)
                return fail(res, `Поле "${rule.field}" обязательно`);
            continue;
        }
        const { check, label } = TYPE_CHECKS[rule.type];
        if (!check(value))
            return fail(res, `Поле "${rule.field}" должно быть ${label}`);
        if (rule.minLength && value.trim().length < rule.minLength) {
            return fail(res, `Поле "${rule.field}" слишком короткое`);
        }
        if (rule.maxLength && value.length > rule.maxLength) {
            return fail(res, `Поле "${rule.field}" слишком длинное`);
        }
    }
    next();
};
exports.validate = validate;
