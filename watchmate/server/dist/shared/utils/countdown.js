"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitCountdown = void 0;
const socketEvents_1 = require("../constants/socketEvents");
const countdown_1 = require("../constants/countdown");
const emitCountdown = (io, roomId, onFinish) => {
    const counts = Array.from({ length: countdown_1.COUNTDOWN_START }, (_, i) => countdown_1.COUNTDOWN_START - i);
    counts.forEach((count, i) => {
        setTimeout(() => io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.COUNTDOWN, count), i * countdown_1.COUNTDOWN_INTERVAL_MS);
    });
    setTimeout(() => {
        io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.COUNTDOWN, 0);
        onFinish?.();
    }, countdown_1.COUNTDOWN_START * countdown_1.COUNTDOWN_INTERVAL_MS);
};
exports.emitCountdown = emitCountdown;
