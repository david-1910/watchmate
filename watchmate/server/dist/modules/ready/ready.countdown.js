"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitCountdown = void 0;
const ready_service_1 = require("./ready.service");
const socketEvents_1 = require("../../shared/constants/socketEvents");
const countdown_1 = require("../../shared/constants/countdown");
const timers_1 = require("../../shared/utils/timers");
// Рассылает countdown 3→0, затем сбрасывает готовность.
// Таймеры с ключом комнаты отменяются при её удалении
const emitCountdown = (io, roomId) => {
    for (let i = 0; i <= countdown_1.COUNTDOWN_START; i++) {
        const count = countdown_1.COUNTDOWN_START - i;
        (0, timers_1.scheduleTimer)((0, ready_service_1.countdownTimerKey)(roomId, count), i * countdown_1.COUNTDOWN_INTERVAL_MS, () => {
            io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.COUNTDOWN, count);
            if (count > 0)
                return;
            const ready = ready_service_1.readyService.finishCountdown(roomId);
            if (ready)
                io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.READY_UPDATE, ready);
        });
    }
};
exports.emitCountdown = emitCountdown;
