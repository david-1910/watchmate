"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCountdownHandlers = void 0;
const state_1 = require("../../state/state");
const socketEvents_1 = require("../../../shared/constants/socketEvents");
const countdown_1 = require("../../../shared/utils/countdown");
const handleStartCountdown = (io, socket, roomId) => {
    if (!state_1.state.userRooms.get(socket.id))
        return;
    (0, countdown_1.emitCountdown)(io, roomId);
};
const registerCountdownHandlers = (io, socket) => {
    socket.on(socketEvents_1.SOCKET_EVENTS.START_COUNTDOWN, (roomId) => handleStartCountdown(io, socket, roomId));
};
exports.registerCountdownHandlers = registerCountdownHandlers;
