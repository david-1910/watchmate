"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onEvent = exports.isHost = exports.getSocketMember = void 0;
const members_service_1 = require("../members/members.service");
const host_service_1 = require("../members/host.service");
// Участник сокета, если он всё ещё в комнате
const getSocketMember = (socket) => members_service_1.membersService.getMember(socket.data.roomId, socket.data.userId);
exports.getSocketMember = getSocketMember;
const isInRoom = (socket) => !!(0, exports.getSocketMember)(socket);
const isHost = (socket) => isInRoom(socket) && host_service_1.hostService.isHost(socket.data.roomId, socket.data.userId);
exports.isHost = isHost;
// Подписка на событие: payload проверяется parse (null — молча отбросить),
// исключение в обработчике не роняет процесс
const onEvent = (socket, event, parse, handler) => {
    socket.on(event, (raw) => {
        try {
            const data = parse(raw);
            if (data !== null)
                handler(data);
        }
        catch (err) {
            console.error(`[SOCKET] Ошибка в обработчике "${event}":`, err.message);
        }
    });
};
exports.onEvent = onEvent;
