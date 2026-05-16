"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoomHandlers = void 0;
const state_1 = require("../../state/state");
const socketEvents_1 = require("../../../shared/constants/socketEvents");
const handleJoinRoom = (io, socket, data) => {
    const { roomId, userName, hostToken } = data;
    if (!roomId || !userName?.trim())
        return;
    socket.join(roomId);
    state_1.state.userNames.set(socket.id, userName.trim());
    state_1.state.userRooms.set(socket.id, roomId);
    console.log(`${userName} вошёл в комнату ${roomId}`);
    const room = state_1.state.rooms.get(roomId);
    const isCreator = hostToken && room?.hostToken === hostToken;
    if (isCreator) {
        state_1.state.roomHosts.set(roomId, socket.id);
        console.log(`${userName} — хост ${roomId} (создатель)`);
    }
    else if (!state_1.state.roomHosts.has(roomId)) {
        state_1.state.roomHosts.set(roomId, socket.id);
        console.log(`${userName} — хост ${roomId} (первый)`);
    }
    io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.USERS_UPDATE, state_1.state.getRoomUsers(roomId));
    io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.HOST_UPDATE, state_1.state.roomHosts.get(roomId));
    socket.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.USER_JOINED, { userId: socket.id, userName });
    const history = state_1.state.roomMessages.get(roomId) ?? [];
    if (history.length > 0)
        socket.emit(socketEvents_1.SOCKET_EVENTS.CHAT_HISTORY, history);
    const currentVideo = state_1.state.roomCurrentVideo.get(roomId);
    if (currentVideo)
        socket.emit(socketEvents_1.SOCKET_EVENTS.VIDEO_UPDATE, currentVideo);
    const queue = state_1.state.roomQueues.get(roomId) ?? [];
    if (queue.length > 0)
        socket.emit(socketEvents_1.SOCKET_EVENTS.QUEUE_UPDATE, queue);
    const suggestions = state_1.state.roomSuggestions.get(roomId) ?? [];
    if (suggestions.length > 0)
        socket.emit(socketEvents_1.SOCKET_EVENTS.SUGGESTIONS_UPDATE, suggestions);
    const readyUsersList = state_1.state.getRoomReadyUsers(roomId);
    if (readyUsersList.length > 0) {
        socket.emit(socketEvents_1.SOCKET_EVENTS.READY_UPDATE, { readyUsers: readyUsersList, allReady: false });
    }
    const playback = state_1.state.roomPlayback.get(roomId);
    if (playback) {
        const elapsed = playback.isPlaying ? (Date.now() - playback.updatedAt) / 1000 : 0;
        socket.emit(socketEvents_1.SOCKET_EVENTS.PLAYBACK_UPDATE, {
            isPlaying: playback.isPlaying,
            currentTime: playback.currentTime + elapsed,
        });
    }
};
const handleDisconnect = (io, socket) => {
    const userName = state_1.state.userNames.get(socket.id);
    const roomId = state_1.state.userRooms.get(socket.id);
    console.log(`${userName ?? socket.id} отключился`);
    state_1.state.userNames.delete(socket.id);
    state_1.state.userRooms.delete(socket.id);
    if (!roomId)
        return;
    state_1.state.readyUsers.get(roomId)?.delete(socket.id);
    io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.READY_UPDATE, {
        readyUsers: state_1.state.getRoomReadyUsers(roomId),
        allReady: false,
    });
    if (state_1.state.roomHosts.get(roomId) === socket.id) {
        const remaining = state_1.state.getRoomUsers(roomId);
        if (remaining.length > 0) {
            state_1.state.roomHosts.set(roomId, remaining[0].userId);
            io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.HOST_UPDATE, remaining[0].userId);
            console.log(`Новый хост: ${remaining[0].userName}`);
        }
        else {
            state_1.state.roomHosts.delete(roomId);
        }
    }
    const remainingUsers = state_1.state.getRoomUsers(roomId);
    io.to(roomId).emit(socketEvents_1.SOCKET_EVENTS.USERS_UPDATE, remainingUsers);
    if (remainingUsers.length === 0) {
        state_1.state.cleanupRoom(roomId);
        console.log(`Комната ${roomId} удалена`);
    }
};
const registerRoomHandlers = (io, socket) => {
    socket.on(socketEvents_1.SOCKET_EVENTS.JOIN_ROOM, (data) => handleJoinRoom(io, socket, data));
    socket.on('disconnect', () => handleDisconnect(io, socket));
};
exports.registerRoomHandlers = registerRoomHandlers;
