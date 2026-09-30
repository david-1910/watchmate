"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeRoomEvents = void 0;
const members_service_1 = require("../members/members.service");
const ready_service_1 = require("../ready/ready.service");
const socketEvents_1 = require("../../shared/constants/socketEvents");
const roomEvents_1 = require("../../shared/utils/roomEvents");
// Сначала session-ended, затем закрытие сокетов (пакеты идут по одному соединению по порядку)
const endSession = (io, channel, reason) => {
    io.to(channel).emit(socketEvents_1.SOCKET_EVENTS.SESSION_ENDED, { reason });
    io.in(channel).disconnectSockets();
};
// Доменные события жизненного цикла → рассылки по сокетам
const subscribeRoomEvents = (io) => {
    roomEvents_1.roomEvents.on('users-changed', (roomId) => {
        io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.USERS_UPDATE, members_service_1.membersService.getUsers(roomId));
    });
    roomEvents_1.roomEvents.on('host-changed', (roomId, hostId) => {
        // host-update несёт строку; null означает, что онлайн никого нет и рассылать некому
        if (hostId)
            io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.HOST_UPDATE, hostId);
        // Хост не участвует в подсчёте готовности — при смене хоста allReady пересчитывается
        io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.READY_UPDATE, ready_service_1.readyService.getState(roomId));
    });
    roomEvents_1.roomEvents.on('ready-changed', (roomId) => {
        io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.READY_UPDATE, ready_service_1.readyService.getState(roomId));
    });
    roomEvents_1.roomEvents.on('member-removed', (_roomId, userId) => endSession(io, userId, 'member-removed'));
    roomEvents_1.roomEvents.on('room-deleted', (roomId) => endSession(io, roomId, 'room-deleted'));
};
exports.subscribeRoomEvents = subscribeRoomEvents;
