"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerQueueHandlers = void 0;
const state_1 = require("../../state/state");
const socketEvents_1 = require("../../../shared/constants/socketEvents");
const generators_1 = require("../../../shared/utils/generators");
const isHost = (socket, roomId) => state_1.state.roomHosts.get(roomId) === socket.id &&
    state_1.state.userRooms.get(socket.id) === roomId;
const getQueue = (roomId) => state_1.state.roomQueues.get(roomId) ?? [];
const handleQueueAdd = (io, socket, data) => {
    if (!isHost(socket, data.roomId) || !data.url?.trim())
        return;
    const queue = [...getQueue(data.roomId), { id: (0, generators_1.generateId)(), url: data.url, title: data.title || data.url }];
    state_1.state.roomQueues.set(data.roomId, queue);
    io.to(data.roomId).emit(socketEvents_1.SOCKET_EVENTS.QUEUE_UPDATE, queue);
};
const handleQueueRemove = (io, socket, data) => {
    if (!isHost(socket, data.roomId))
        return;
    const queue = getQueue(data.roomId).filter((item) => item.id !== data.itemId);
    state_1.state.roomQueues.set(data.roomId, queue);
    io.to(data.roomId).emit(socketEvents_1.SOCKET_EVENTS.QUEUE_UPDATE, queue);
};
const handleQueuePlay = (io, socket, data) => {
    if (!isHost(socket, data.roomId))
        return;
    const queue = getQueue(data.roomId);
    const item = queue.find((i) => i.id === data.itemId);
    if (!item)
        return;
    const filtered = queue.filter((i) => i.id !== data.itemId);
    state_1.state.roomQueues.set(data.roomId, filtered);
    io.to(data.roomId).emit(socketEvents_1.SOCKET_EVENTS.QUEUE_UPDATE, filtered);
    io.to(data.roomId).emit(socketEvents_1.SOCKET_EVENTS.VIDEO_UPDATE, item.url);
};
const handleQueueReorder = (io, socket, data) => {
    if (!isHost(socket, data.roomId))
        return;
    const queue = [...getQueue(data.roomId)];
    const { fromIndex, toIndex } = data;
    if (fromIndex < 0 || fromIndex >= queue.length ||
        toIndex < 0 || toIndex >= queue.length ||
        fromIndex === toIndex)
        return;
    const [moved] = queue.splice(fromIndex, 1);
    queue.splice(toIndex, 0, moved);
    state_1.state.roomQueues.set(data.roomId, queue);
    io.to(data.roomId).emit(socketEvents_1.SOCKET_EVENTS.QUEUE_UPDATE, queue);
};
const handleQueueNext = (io, socket, data) => {
    if (!isHost(socket, data.roomId))
        return;
    const queue = getQueue(data.roomId);
    if (queue.length === 0)
        return;
    const [next, ...rest] = queue;
    state_1.state.roomQueues.set(data.roomId, rest);
    io.to(data.roomId).emit(socketEvents_1.SOCKET_EVENTS.QUEUE_UPDATE, rest);
    io.to(data.roomId).emit(socketEvents_1.SOCKET_EVENTS.VIDEO_UPDATE, next.url);
};
const registerQueueHandlers = (io, socket) => {
    socket.on(socketEvents_1.SOCKET_EVENTS.QUEUE_ADD, (data) => handleQueueAdd(io, socket, data));
    socket.on(socketEvents_1.SOCKET_EVENTS.QUEUE_REMOVE, (data) => handleQueueRemove(io, socket, data));
    socket.on(socketEvents_1.SOCKET_EVENTS.QUEUE_PLAY, (data) => handleQueuePlay(io, socket, data));
    socket.on(socketEvents_1.SOCKET_EVENTS.QUEUE_REORDER, (data) => handleQueueReorder(io, socket, data));
    socket.on(socketEvents_1.SOCKET_EVENTS.QUEUE_NEXT, (data) => handleQueueNext(io, socket, data));
};
exports.registerQueueHandlers = registerQueueHandlers;
