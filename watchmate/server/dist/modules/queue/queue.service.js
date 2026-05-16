"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueService = void 0;
const state_1 = require("../state/state");
const generators_1 = require("../../shared/utils/generators");
const getQueue = (roomId) => state_1.state.roomQueues.get(roomId) ?? [];
const add = (roomId, url, title) => {
    const queue = [...getQueue(roomId), { id: (0, generators_1.generateId)(), url, title: title || url }];
    state_1.state.roomQueues.set(roomId, queue);
    return queue;
};
const remove = (roomId, itemId) => {
    const queue = getQueue(roomId).filter((i) => i.id !== itemId);
    state_1.state.roomQueues.set(roomId, queue);
    return queue;
};
const play = (roomId, itemId) => {
    const queue = getQueue(roomId);
    const item = queue.find((i) => i.id === itemId);
    if (!item)
        return null;
    const filtered = queue.filter((i) => i.id !== itemId);
    state_1.state.roomQueues.set(roomId, filtered);
    return { queue: filtered, url: item.url };
};
const next = (roomId) => {
    const queue = getQueue(roomId);
    if (!queue.length)
        return null;
    const [first, ...rest] = queue;
    state_1.state.roomQueues.set(roomId, rest);
    return { queue: rest, url: first.url };
};
const reorder = (roomId, fromIndex, toIndex) => {
    const queue = [...getQueue(roomId)];
    if (fromIndex < 0 || fromIndex >= queue.length ||
        toIndex < 0 || toIndex >= queue.length ||
        fromIndex === toIndex)
        return null;
    const [moved] = queue.splice(fromIndex, 1);
    queue.splice(toIndex, 0, moved);
    state_1.state.roomQueues.set(roomId, queue);
    return queue;
};
exports.queueService = { getQueue, add, remove, play, next, reorder };
