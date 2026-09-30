"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueService = void 0;
const state_1 = require("../state/state");
const playback_service_1 = require("../playback/playback.service");
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
// Убирает элемент из очереди и делает его текущим видео комнаты
const takeAndPlay = (roomId, item) => {
    const queue = remove(roomId, item.id);
    return { video: playback_service_1.playbackService.setVideo(roomId, item.url), queue };
};
const play = (roomId, itemId) => {
    const item = getQueue(roomId).find((i) => i.id === itemId);
    return item ? takeAndPlay(roomId, item) : null;
};
const next = (roomId) => {
    const [first] = getQueue(roomId);
    return first ? takeAndPlay(roomId, first) : null;
};
const reorder = (roomId, fromIndex, toIndex) => {
    const queue = [...getQueue(roomId)];
    const isValidIndex = (i) => Number.isInteger(i) && i >= 0 && i < queue.length;
    if (!isValidIndex(fromIndex) || !isValidIndex(toIndex) || fromIndex === toIndex)
        return null;
    const [moved] = queue.splice(fromIndex, 1);
    queue.splice(toIndex, 0, moved);
    state_1.state.roomQueues.set(roomId, queue);
    return queue;
};
exports.queueService = { getQueue, add, remove, play, next, reorder };
