"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.state = void 0;
const MAX_MESSAGES = 100;
const rooms = new Map();
const userNames = new Map();
const userRooms = new Map();
const readyUsers = new Map();
const roomHosts = new Map();
const roomQueues = new Map();
const roomSuggestions = new Map();
const roomMessages = new Map();
const roomCurrentVideo = new Map();
const roomPlayback = new Map();
const getRoomUsers = (roomId) => {
    const hostId = roomHosts.get(roomId);
    const users = [];
    userRooms.forEach((room, userId) => {
        if (room === roomId) {
            users.push({ userId, userName: userNames.get(userId) ?? 'Аноним' });
        }
    });
    return users.sort((a, b) => {
        if (a.userId === hostId)
            return -1;
        if (b.userId === hostId)
            return 1;
        return 0;
    });
};
const getRoomReadyUsers = (roomId) => Array.from(readyUsers.get(roomId) ?? []);
const cleanupRoom = (roomId) => {
    rooms.delete(roomId);
    roomHosts.delete(roomId);
    readyUsers.delete(roomId);
    roomQueues.delete(roomId);
    roomSuggestions.delete(roomId);
    roomMessages.delete(roomId);
    roomCurrentVideo.delete(roomId);
    roomPlayback.delete(roomId);
};
const addMessage = (roomId, message) => {
    const msgs = roomMessages.get(roomId) ?? [];
    msgs.push(message);
    if (msgs.length > MAX_MESSAGES)
        msgs.shift();
    roomMessages.set(roomId, msgs);
};
exports.state = {
    rooms,
    userNames,
    userRooms,
    readyUsers,
    roomHosts,
    roomQueues,
    roomSuggestions,
    roomMessages,
    roomCurrentVideo,
    roomPlayback,
    getRoomUsers,
    getRoomReadyUsers,
    cleanupRoom,
    addMessage,
};
