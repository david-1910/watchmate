"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.state = void 0;
const rooms = new Map();
const roomIdsByCode = new Map();
const members = new Map();
const memberTokens = new Map();
const roomHosts = new Map();
const readyUsers = new Map();
const activeCountdowns = new Set();
const roomQueues = new Map();
// roomId → (requestId → запрос зрителя, ждущий ответа хоста)
const roomRequests = new Map();
const roomSuggestions = new Map();
const roomMessages = new Map();
const roomCurrentVideo = new Map();
const roomPlayback = new Map();
// Участники комнаты в порядке входа
const getMembers = (roomId) => [...(members.get(roomId)?.values() ?? [])].sort((a, b) => a.joinedAt - b.joinedAt);
const getOnlineMembers = (roomId) => getMembers(roomId).filter((m) => m.sockets > 0);
const getMember = (roomId, userId) => members.get(roomId)?.get(userId);
const addMember = (roomId, member) => {
    const roomMembers = members.get(roomId) ?? new Map();
    roomMembers.set(member.userId, member);
    members.set(roomId, roomMembers);
    memberTokens.set(member.token, { roomId, userId: member.userId });
};
const deleteMember = (roomId, userId) => {
    const member = getMember(roomId, userId);
    if (!member)
        return;
    memberTokens.delete(member.token);
    members.get(roomId)?.delete(userId);
};
// Удаляет комнату со всеми её данными, включая токены участников
const deleteRoom = (roomId) => {
    const room = rooms.get(roomId);
    if (room)
        roomIdsByCode.delete(room.joinCode);
    getMembers(roomId).forEach((m) => memberTokens.delete(m.token));
    rooms.delete(roomId);
    members.delete(roomId);
    roomHosts.delete(roomId);
    readyUsers.delete(roomId);
    activeCountdowns.delete(roomId);
    roomQueues.delete(roomId);
    roomSuggestions.delete(roomId);
    roomMessages.delete(roomId);
    roomCurrentVideo.delete(roomId);
    roomPlayback.delete(roomId);
    roomRequests.delete(roomId);
};
exports.state = {
    rooms,
    roomIdsByCode,
    memberTokens,
    roomHosts,
    readyUsers,
    activeCountdowns,
    roomQueues,
    roomSuggestions,
    roomMessages,
    roomCurrentVideo,
    roomPlayback,
    roomRequests,
    getMembers,
    getOnlineMembers,
    getMember,
    addMember,
    deleteMember,
    deleteRoom,
};
