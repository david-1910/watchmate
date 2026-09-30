"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hostService = void 0;
const state_1 = require("../state/state");
const env_1 = require("../../shared/config/env");
const roomEvents_1 = require("../../shared/utils/roomEvents");
const timers_1 = require("../../shared/utils/timers");
const hostTimerKey = (roomId) => `${roomId}:host`;
const getHostId = (roomId) => state_1.state.roomHosts.get(roomId) ?? null;
const isHost = (roomId, userId) => getHostId(roomId) === userId;
const isHostOnline = (roomId) => {
    const hostId = getHostId(roomId);
    return !!hostId && (state_1.state.getMember(roomId, hostId)?.sockets ?? 0) > 0;
};
const setHost = (roomId, hostId) => {
    (0, timers_1.cancelTimer)(hostTimerKey(roomId));
    if (getHostId(roomId) === hostId)
        return;
    if (hostId)
        state_1.state.roomHosts.set(roomId, hostId);
    else
        state_1.state.roomHosts.delete(roomId);
    roomEvents_1.roomEvents.emit('host-changed', roomId, hostId);
    console.log(`Хост комнаты ${roomId}: ${hostId ?? 'нет'}`);
};
// Роль переходит к онлайн-участнику, который вошёл раньше всех; если онлайн никого — null
const handOver = (roomId) => {
    const currentHostId = getHostId(roomId);
    const next = state_1.state.getOnlineMembers(roomId).find((m) => m.userId !== currentHostId);
    setHost(roomId, next?.userId ?? null);
};
const scheduleHandOver = (roomId) => (0, timers_1.scheduleTimer)(hostTimerKey(roomId), env_1.env.hostGraceMs, () => handOver(roomId));
const cancelHandOver = (roomId) => (0, timers_1.cancelTimer)(hostTimerKey(roomId));
const transfer = (roomId, targetUserId) => {
    const target = state_1.state.getMember(roomId, targetUserId);
    if (!target)
        return 'not-found';
    if (target.sockets === 0)
        return 'offline';
    setHost(roomId, targetUserId);
    return 'ok';
};
exports.hostService = { getHostId, isHost, isHostOnline, setHost, handOver, scheduleHandOver, cancelHandOver, transfer };
