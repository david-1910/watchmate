"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playbackService = void 0;
const state_1 = require("../state/state");
const ready_service_1 = require("../ready/ready.service");
// '' — видео нет
const getVideo = (roomId) => state_1.state.roomCurrentVideo.get(roomId) ?? '';
// Новое видео — сохранённая позиция предыдущего больше не актуальна
const setVideo = (roomId, url) => {
    state_1.state.roomCurrentVideo.set(roomId, url);
    state_1.state.roomPlayback.delete(roomId);
    ready_service_1.readyService.cancelCountdown(roomId);
    return url;
};
const clearVideo = (roomId) => {
    state_1.state.roomCurrentVideo.delete(roomId);
    state_1.state.roomPlayback.delete(roomId);
    ready_service_1.readyService.cancelCountdown(roomId);
    return '';
};
const savePosition = (roomId, { isPlaying, currentTime }) => {
    state_1.state.roomPlayback.set(roomId, { isPlaying, currentTime, updatedAt: Date.now() });
};
// Текущая позиция с учётом времени, прошедшего с последней синхронизации
const getPosition = (roomId) => {
    const playback = state_1.state.roomPlayback.get(roomId);
    if (!playback)
        return null;
    const elapsed = playback.isPlaying ? (Date.now() - playback.updatedAt) / 1000 : 0;
    return { isPlaying: playback.isPlaying, currentTime: playback.currentTime + elapsed };
};
exports.playbackService = { getVideo, setVideo, clearVideo, savePosition, getPosition };
