"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPresenceHandlers = void 0;
const members_service_1 = require("../../members/members.service");
const socket_guards_1 = require("../socket.guards");
// Служебное событие Socket.IO, не часть SOCKET_EVENTS
const DISCONNECT = 'disconnect';
// Сокет прошёл аутентификацию: комната + личный канал участника (для адресной рассылки)
const registerPresenceHandlers = (_io, socket) => {
    const { roomId, userId } = socket.data;
    socket.join([roomId, userId]);
    members_service_1.membersService.connect(roomId, userId);
    (0, socket_guards_1.onEvent)(socket, DISCONNECT, () => true, () => members_service_1.membersService.disconnect(roomId, userId));
};
exports.registerPresenceHandlers = registerPresenceHandlers;
