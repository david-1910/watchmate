"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerReadyHandlers = void 0;
const state_1 = require("../../state/state");
const socketEvents_1 = require("../../../shared/constants/socketEvents");
const countdown_1 = require("../../../shared/utils/countdown");
const handleToggleReady = (io, socket, roomId) => {
    if (!state_1.state.userRooms.get(socket.id))
        return;
    if (!state_1.state.readyUsers.has(roomId)) {
        state_1.state.readyUsers.set(roomId, new Set());
    }
    const roomReady = state_1.state.readyUsers.get(roomId);
    roomReady.has(socket.id) ? roomReady.delete(socket.id) : roomReady.add(socket.id);
    const readyList = state_1.state.getRoomReadyUsers(roomId);
    const totalUsers = state_1.state.getRoomUsers(roomId).length;
    const allReady = readyList.length === totalUsers && totalUsers > 0;
    io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.READY_UPDATE, { readyUsers: readyList, allReady });
    if (allReady) {
        (0, countdown_1.emitCountdown)(io, roomId, () => {
            state_1.state.readyUsers.set(roomId, new Set());
            io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.READY_UPDATE, { readyUsers: [], allReady: false });
        });
    }
};
const registerReadyHandlers = (io, socket) => {
    socket.on(socketEvents_1.SOCKET_EVENTS.TOGGLE_READY, (roomId) => handleToggleReady(io, socket, roomId));
};
exports.registerReadyHandlers = registerReadyHandlers;
