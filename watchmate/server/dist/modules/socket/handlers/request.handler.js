"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRequestHandlers = void 0;
const state_1 = require("../../state/state");
const socketEvents_1 = require("../../../shared/constants/socketEvents");
const handlePlaybackRequest = (io, socket, data) => {
    const userRoom = state_1.state.userRooms.get(socket.id);
    if (!userRoom || userRoom !== data.roomId)
        return;
    const hostSocketId = state_1.state.roomHosts.get(data.roomId);
    if (!hostSocketId || hostSocketId === socket.id)
        return;
    const fromUserName = state_1.state.userNames.get(socket.id) ?? 'Аноним';
    io.to(hostSocketId).emit(socketEvents_1.SOCKET_EVENTS.PLAYBACK_REQUEST_NOTIFY, {
        id: `${socket.id}-${Date.now()}`,
        fromUserId: socket.id,
        fromUserName,
        type: data.type,
        videoUrl: data.videoUrl,
    });
};
const registerRequestHandlers = (io, socket) => {
    socket.on(socketEvents_1.SOCKET_EVENTS.PLAYBACK_REQUEST, (data) => handlePlaybackRequest(io, socket, data));
};
exports.registerRequestHandlers = registerRequestHandlers;
