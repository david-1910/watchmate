"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerReactionsHandlers = void 0;
const state_1 = require("../../state/state");
const socketEvents_1 = require("../../../shared/constants/socketEvents");
const handleReaction = (io, socket, data) => {
    if (state_1.state.userRooms.get(socket.id) !== data.roomId)
        return;
    const userName = state_1.state.userNames.get(socket.id) ?? 'Аноним';
    io.to(data.roomId).emit(socketEvents_1.SOCKET_EVENTS.REACTION, { userId: socket.id, userName, emoji: data.emoji });
};
const registerReactionsHandlers = (io, socket) => {
    socket.on(socketEvents_1.SOCKET_EVENTS.REACTION, (data) => handleReaction(io, socket, data));
};
exports.registerReactionsHandlers = registerReactionsHandlers;
