"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPlaybackHandlers = void 0;
const state_1 = require("../../state/state");
const socketEvents_1 = require("../../../shared/constants/socketEvents");
const handlePlaybackSync = (io, socket, data) => {
    const userRoom = state_1.state.userRooms.get(socket.id);
    if (!userRoom || userRoom !== data.roomId)
        return;
    state_1.state.roomPlayback.set(data.roomId, {
        isPlaying: data.isPlaying,
        currentTime: data.currentTime,
        updatedAt: Date.now(),
    });
    socket.to(data.roomId).emit(socketEvents_1.SOCKET_EVENTS.PLAYBACK_UPDATE, {
        isPlaying: data.isPlaying,
        currentTime: data.currentTime,
    });
};
const registerPlaybackHandlers = (io, socket) => {
    socket.on(socketEvents_1.SOCKET_EVENTS.PLAYBACK_SYNC, (data) => handlePlaybackSync(io, socket, data));
};
exports.registerPlaybackHandlers = registerPlaybackHandlers;
