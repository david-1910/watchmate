"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendValidationError = exports.sendNotFound = exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, status = 200) => {
    const body = { success: true, data };
    res.status(status).json(body);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message, code, status) => {
    const body = { success: false, error: { message, code } };
    res.status(status).json(body);
};
exports.sendError = sendError;
const sendNotFound = (res, message) => (0, exports.sendError)(res, message, 'NOT_FOUND', 404);
exports.sendNotFound = sendNotFound;
const sendValidationError = (res, message) => (0, exports.sendError)(res, message, 'VALIDATION_ERROR', 400);
exports.sendValidationError = sendValidationError;
