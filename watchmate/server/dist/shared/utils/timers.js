"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelTimersByPrefix = exports.scheduleTimer = exports.cancelTimer = void 0;
// Реестр именованных таймеров. Ключи начинаются с roomId, чтобы при удалении
// комнаты можно было отменить все её таймеры одним вызовом
const timers = new Map();
const cancelTimer = (key) => {
    const timer = timers.get(key);
    if (!timer)
        return;
    clearTimeout(timer);
    timers.delete(key);
};
exports.cancelTimer = cancelTimer;
const scheduleTimer = (key, ms, fn) => {
    (0, exports.cancelTimer)(key);
    timers.set(key, setTimeout(() => {
        timers.delete(key);
        fn();
    }, ms));
};
exports.scheduleTimer = scheduleTimer;
const cancelTimersByPrefix = (prefix) => {
    for (const key of [...timers.keys()]) {
        if (key.startsWith(prefix))
            (0, exports.cancelTimer)(key);
    }
};
exports.cancelTimersByPrefix = cancelTimersByPrefix;
