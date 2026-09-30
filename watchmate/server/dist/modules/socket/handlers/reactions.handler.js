"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerReactionsHandlers = void 0;
const socket_guards_1 = require("../socket.guards");
const socketEvents_1 = require("../../../shared/constants/socketEvents");
const limits_1 = require("../../../shared/constants/limits");
const validators_1 = require("../../../shared/utils/validators");
const parseReaction = (raw) => (0, validators_1.isObject)(raw) && (0, validators_1.isBoundedString)(raw.emoji, limits_1.REACTION_MAX_LENGTH) ? { emoji: raw.emoji } : null;
const handleReaction = (io, socket, { emoji }) => {
    const member = (0, socket_guards_1.getSocketMember)(socket);
    if (!member)
        return;
    io.to(socket.data.roomId).emit(socketEvents_1.SOCKET_EVENTS.REACTION, { userId: member.userId, userName: member.userName, emoji });
};
const registerReactionsHandlers = (io, socket) => {
    (0, socket_guards_1.onEvent)(socket, socketEvents_1.SOCKET_EVENTS.REACTION, parseReaction, (data) => handleReaction(io, socket, data));
};
exports.registerReactionsHandlers = registerReactionsHandlers;
