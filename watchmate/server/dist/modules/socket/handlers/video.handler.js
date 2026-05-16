"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerVideoHandlers = void 0;
const state_1 = require("../../state/state");
const socketEvents_1 = require("../../../shared/constants/socketEvents");
const isInRoom = (socket, roomId) => state_1.state.userRooms.get(socket.id) === roomId;
const handleShareVideo = (io, socket, data) => {
    if (!isInRoom(socket, data.roomId))
        return;
    state_1.state.roomCurrentVideo.set(data.roomId, data.videoUrl);
    io.to(data.roomId).emit(socketEvents_1.SOCKET_EVENTS.VIDEO_UPDATE, data.videoUrl);
};
const handleClearVideo = (io, socket, roomId) => {
    if (!isInRoom(socket, roomId))
        return;
    state_1.state.roomCurrentVideo.delete(roomId);
    io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.VIDEO_UPDATE, '');
    io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.LOCAL_FILE_UPDATE, null);
};
const handleShareLocalFile = (io, socket, data) => {
    if (!isInRoom(socket, data.roomId))
        return;
    io.to(data.roomId).emit(socketEvents_1.SOCKET_EVENTS.LOCAL_FILE_UPDATE, data.fileName);
};
const registerVideoHandlers = (io, socket) => {
    socket.on(socketEvents_1.SOCKET_EVENTS.SHARE_VIDEO, (data) => handleShareVideo(io, socket, data));
    socket.on(socketEvents_1.SOCKET_EVENTS.CLEAR_VIDEO, (roomId) => handleClearVideo(io, socket, roomId));
    socket.on(socketEvents_1.SOCKET_EVENTS.SHARE_LOCAL_FILE, (data) => handleShareLocalFile(io, socket, data));
};
exports.registerVideoHandlers = registerVideoHandlers;
