"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPlaybackHandlers = void 0;
const playback_service_1 = require("../../playback/playback.service");
const socket_guards_1 = require("../socket.guards");
const socketEvents_1 = require("../../../shared/constants/socketEvents");
const validators_1 = require("../../../shared/utils/validators");
const parsePlaybackSync = (raw) => {
    if (!(0, validators_1.isObject)(raw) || typeof raw.isPlaying !== 'boolean')
        return null;
    const { currentTime } = raw;
    if (typeof currentTime !== 'number' || !Number.isFinite(currentTime) || currentTime < 0)
        return null;
    return { isPlaying: raw.isPlaying, currentTime };
};
const handlePlaybackSync = (socket, playback) => {
    if (!(0, socket_guards_1.isHost)(socket))
        return;
    playback_service_1.playbackService.savePosition(socket.data.roomId, playback);
    socket.to(socket.data.roomId).emit(socketEvents_1.SOCKET_EVENTS.PLAYBACK_UPDATE, playback);
};
const registerPlaybackHandlers = (_io, socket) => {
    (0, socket_guards_1.onEvent)(socket, socketEvents_1.SOCKET_EVENTS.PLAYBACK_SYNC, parsePlaybackSync, (data) => handlePlaybackSync(socket, data));
};
exports.registerPlaybackHandlers = registerPlaybackHandlers;
