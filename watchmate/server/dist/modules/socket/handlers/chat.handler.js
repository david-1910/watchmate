"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerChatHandlers = void 0;
const state_1 = require("../../state/state");
const socketEvents_1 = require("../../../shared/constants/socketEvents");
const MAX_MESSAGE_LENGTH = 500;
const handleChatMessage = (io, socket, data) => {
    const userRoom = state_1.state.userRooms.get(socket.id);
    if (!userRoom || userRoom !== data.roomId)
        return;
    if (!data.message?.trim() || data.message.length > MAX_MESSAGE_LENGTH)
        return;
    const userName = state_1.state.userNames.get(socket.id) ?? 'Аноним';
    const msg = { userId: socket.id, userName, message: data.message.trim(), timestamp: new Date() };
    state_1.state.addMessage(data.roomId, msg);
    io.to(data.roomId).emit(socketEvents_1.SOCKET_EVENTS.CHAT_MESSAGE, msg);
};
const registerChatHandlers = (io, socket) => {
    socket.on(socketEvents_1.SOCKET_EVENTS.CHAT_MESSAGE, (data) => handleChatMessage(io, socket, data));
};
exports.registerChatHandlers = registerChatHandlers;
