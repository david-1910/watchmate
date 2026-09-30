"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatService = void 0;
const state_1 = require("../state/state");
const generators_1 = require("../../shared/utils/generators");
const limits_1 = require("../../shared/constants/limits");
const getLog = (roomId) => {
    const log = state_1.state.roomMessages.get(roomId) ?? { messages: [], lastSeq: 0 };
    state_1.state.roomMessages.set(roomId, log);
    return log;
};
const getLastSeq = (roomId) => state_1.state.roomMessages.get(roomId)?.lastSeq ?? 0;
// Сообщения с seq > afterSeq, от старых к новым
const getMessages = (roomId, afterSeq) => {
    const log = state_1.state.roomMessages.get(roomId);
    return {
        messages: log?.messages.filter((m) => m.seq > afterSeq) ?? [],
        lastSeq: log?.lastSeq ?? 0,
    };
};
// Идемпотентно по clientId: повтор возвращает уже сохранённое сообщение
const post = (roomId, { clientId, message, userId, userName }) => {
    const log = getLog(roomId);
    const existing = log.messages.find((m) => m.clientId === clientId);
    if (existing)
        return { message: existing, created: false };
    const stored = {
        id: (0, generators_1.generateId)(),
        clientId,
        seq: log.lastSeq + 1,
        userId,
        userName,
        message: message.trim(),
        timestamp: new Date().toISOString(),
    };
    log.messages.push(stored);
    log.lastSeq = stored.seq;
    if (log.messages.length > limits_1.MAX_MESSAGES)
        log.messages.shift();
    return { message: stored, created: true };
};
exports.chatService = { getMessages, getLastSeq, post };
