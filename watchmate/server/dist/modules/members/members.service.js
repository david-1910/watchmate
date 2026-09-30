"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.membersService = void 0;
const state_1 = require("../state/state");
const rooms_service_1 = require("../rooms/rooms.service");
const ready_service_1 = require("../ready/ready.service");
const host_service_1 = require("./host.service");
const env_1 = require("../../shared/config/env");
const roomEvents_1 = require("../../shared/utils/roomEvents");
const timers_1 = require("../../shared/utils/timers");
const generators_1 = require("../../shared/utils/generators");
const memberTimerKey = (roomId, userId) => `${roomId}:member:${userId}`;
const hasOnlineMembers = (roomId) => state_1.state.getOnlineMembers(roomId).length > 0;
const removeMember = (roomId, userId) => {
    if (!state_1.state.getMember(roomId, userId))
        return;
    const wasHost = host_service_1.hostService.isHost(roomId, userId);
    (0, timers_1.cancelTimer)(memberTimerKey(roomId, userId));
    state_1.state.deleteMember(roomId, userId);
    roomEvents_1.roomEvents.emit('member-removed', roomId, userId);
    if (wasHost)
        host_service_1.hostService.handOver(roomId);
    if (ready_service_1.readyService.remove(roomId, userId))
        roomEvents_1.roomEvents.emit('ready-changed', roomId);
    roomEvents_1.roomEvents.emit('users-changed', roomId);
    console.log(`Участник ${userId} удалён из комнаты ${roomId}`);
};
// Участник без живого сокета удаляется через MEMBER_GRACE_MS
const scheduleRemoval = (roomId, userId) => (0, timers_1.scheduleTimer)(memberTimerKey(roomId, userId), env_1.env.memberGraceMs, () => removeMember(roomId, userId));
// null — неверный пароль. Верный hostToken пропускает проверку пароля
const join = (room, { userName, password, hostToken }) => {
    const hasHostToken = rooms_service_1.roomsService.isHostToken(room, hostToken);
    if (!hasHostToken && !rooms_service_1.roomsService.checkPassword(room, password))
        return null;
    const member = {
        userId: (0, generators_1.generateId)(),
        userName: userName.trim(),
        token: (0, generators_1.generateSecretToken)(),
        joinedAt: Date.now(),
        sockets: 0,
    };
    state_1.state.addMember(room.id, member);
    scheduleRemoval(room.id, member.userId);
    // hostToken даёт роль, только если хоста нет или он офлайн
    if (hasHostToken && !host_service_1.hostService.isHostOnline(room.id)) {
        host_service_1.hostService.setHost(room.id, member.userId);
        host_service_1.hostService.scheduleHandOver(room.id);
    }
    return { userId: member.userId, memberToken: member.token, isHost: host_service_1.hostService.isHost(room.id, member.userId) };
};
// Выход по запросу: участник удаляется сразу, роль хоста передаётся сразу
const leave = (roomId, userId) => {
    removeMember(roomId, userId);
    if (!hasOnlineMembers(roomId))
        rooms_service_1.roomsService.scheduleEmptyRoomDeletion(roomId);
};
const authenticate = (roomId, memberToken) => {
    const ref = state_1.state.memberTokens.get(memberToken);
    return ref?.roomId === roomId ? state_1.state.getMember(roomId, ref.userId) : undefined;
};
const getMember = (roomId, userId) => state_1.state.getMember(roomId, userId);
// Новый сокет участника. Первый сокет делает его онлайн и отменяет таймеры
const connect = (roomId, userId) => {
    const member = state_1.state.getMember(roomId, userId);
    if (!member)
        return;
    member.sockets += 1;
    if (member.sockets === 1) {
        (0, timers_1.cancelTimer)(memberTimerKey(roomId, userId));
        rooms_service_1.roomsService.cancelEmptyRoomDeletion(roomId);
        if (host_service_1.hostService.isHost(roomId, userId))
            host_service_1.hostService.cancelHandOver(roomId);
        // Хоста нет — роль получает первый вернувшийся онлайн
        else if (host_service_1.hostService.getHostId(roomId) === null)
            host_service_1.hostService.setHost(roomId, userId);
    }
    roomEvents_1.roomEvents.emit('users-changed', roomId);
    // allReady считается по онлайн-зрителям — пересчитываем при смене статуса
    if (member.sockets === 1)
        roomEvents_1.roomEvents.emit('ready-changed', roomId);
};
// Участник офлайн, только когда закрыт последний его сокет
const disconnect = (roomId, userId) => {
    const member = state_1.state.getMember(roomId, userId);
    if (!member || member.sockets === 0)
        return;
    member.sockets -= 1;
    if (member.sockets > 0)
        return;
    scheduleRemoval(roomId, userId);
    if (host_service_1.hostService.isHost(roomId, userId))
        host_service_1.hostService.scheduleHandOver(roomId);
    if (!hasOnlineMembers(roomId))
        rooms_service_1.roomsService.scheduleEmptyRoomDeletion(roomId);
    roomEvents_1.roomEvents.emit('users-changed', roomId);
    roomEvents_1.roomEvents.emit('ready-changed', roomId);
};
// Хост первым, остальные в порядке входа
const getUsers = (roomId) => {
    const hostId = host_service_1.hostService.getHostId(roomId);
    const users = state_1.state.getMembers(roomId).map((m) => ({ userId: m.userId, userName: m.userName, online: m.sockets > 0 }));
    return [...users.filter((u) => u.userId === hostId), ...users.filter((u) => u.userId !== hostId)];
};
exports.membersService = { join, leave, authenticate, getMember, connect, disconnect, getUsers };
