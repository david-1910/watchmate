"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTransferHandlers = void 0;
const state_1 = require("../../state/state");
const socketEvents_1 = require("../../../shared/constants/socketEvents");
const handleTransferHost = (io, socket, targetUserId) => {
    const roomId = state_1.state.userRooms.get(socket.id);
    if (!roomId)
        return;
    if (state_1.state.roomHosts.get(roomId) !== socket.id)
        return;
    const users = state_1.state.getRoomUsers(roomId);
    const target = users.find((u) => u.userId === targetUserId);
    if (!target)
        return;
    state_1.state.roomHosts.set(roomId, targetUserId);
    io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.HOST_UPDATE, targetUserId);
    console.log(`Хост передан: ${target.userName} в комнате ${roomId}`);
};
const registerTransferHandlers = (io, socket) => {
    socket.on(socketEvents_1.SOCKET_EVENTS.TRANSFER_HOST, (targetUserId) => handleTransferHost(io, socket, targetUserId));
};
exports.registerTransferHandlers = registerTransferHandlers;
