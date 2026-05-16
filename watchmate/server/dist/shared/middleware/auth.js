"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireHost = void 0;
const state_1 = require("../../modules/state/state");
const response_1 = require("../utils/response");
const requireHost = (req, res, next) => {
    const rawId = req.params.roomId ?? req.params.id ?? '';
    const roomId = (Array.isArray(rawId) ? rawId[0] : rawId).toUpperCase();
    const token = req.headers.authorization?.replace('Bearer ', '');
    const room = state_1.state.rooms.get(roomId);
    if (!room) {
        (0, response_1.sendError)(res, 'Комната не найдена', 'NOT_FOUND', 404);
        return;
    }
    if (!token || room.hostToken !== token) {
        (0, response_1.sendError)(res, 'Только хост может выполнять это действие', 'FORBIDDEN', 403);
        return;
    }
    next();
};
exports.requireHost = requireHost;
