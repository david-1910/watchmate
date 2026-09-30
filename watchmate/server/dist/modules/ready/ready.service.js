"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readyService = exports.countdownTimerKey = void 0;
const state_1 = require("../state/state");
const timers_1 = require("../../shared/utils/timers");
// Ключ таймера шага отсчёта; общий префикс позволяет отменить весь отсчёт разом
const countdownTimerKey = (roomId, count = '') => `${roomId}:countdown:${count}`;
exports.countdownTimerKey = countdownTimerKey;
// Хост готов по умолчанию и в подсчёте не участвует.
// allReady — все онлайн-зрители готовы (если зрителей нет — true); готовность офлайн-участников сохраняется
const getState = (roomId) => {
    const ready = state_1.state.readyUsers.get(roomId) ?? new Set();
    const hostId = state_1.state.roomHosts.get(roomId);
    const viewers = state_1.state.getOnlineMembers(roomId).filter((m) => m.userId !== hostId);
    return {
        readyUsers: [...ready].filter((id) => id !== hostId),
        allReady: viewers.every((m) => ready.has(m.userId)),
    };
};
const toggle = (roomId, userId) => {
    const ready = state_1.state.readyUsers.get(roomId) ?? new Set();
    if (ready.has(userId))
        ready.delete(userId);
    else
        ready.add(userId);
    state_1.state.readyUsers.set(roomId, ready);
    return getState(roomId);
};
// Отсчёт запускает хост, когда все зрители готовы; второй не стартует, пока идёт первый
const start = (roomId) => {
    if (state_1.state.activeCountdowns.has(roomId))
        return 'running';
    if (!getState(roomId).allReady)
        return 'not-ready';
    state_1.state.activeCountdowns.add(roomId);
    return 'started';
};
// Конец отсчёта сбрасывает готовность; null, если комнаты уже нет
const finishCountdown = (roomId) => {
    if (!state_1.state.rooms.has(roomId))
        return null;
    state_1.state.activeCountdowns.delete(roomId);
    state_1.state.readyUsers.set(roomId, new Set());
    return getState(roomId);
};
// Видео сменили или закрыли во время отсчёта — отсчёт отменяется, иначе он запустил бы уже другое видео
const cancelCountdown = (roomId) => {
    if (!state_1.state.activeCountdowns.delete(roomId))
        return;
    (0, timers_1.cancelTimersByPrefix)((0, exports.countdownTimerKey)(roomId));
};
// true, если участник был в списке готовых
const remove = (roomId, userId) => state_1.state.readyUsers.get(roomId)?.delete(userId) ?? false;
exports.readyService = { getState, toggle, start, finishCountdown, cancelCountdown, remove };
