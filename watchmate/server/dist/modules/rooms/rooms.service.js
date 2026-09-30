"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomsService = void 0;
const state_1 = require("../state/state");
const env_1 = require("../../shared/config/env");
const roomEvents_1 = require("../../shared/utils/roomEvents");
const timers_1 = require("../../shared/utils/timers");
const generators_1 = require("../../shared/utils/generators");
const emptyTimerKey = (roomId) => `${roomId}:empty`;
// Код вводится вручную: верхний регистр, без дефисов и пробелов
const normalizeJoinCode = (code) => code.toUpperCase().replace(/[-\s]/g, '');
const generateUniqueJoinCode = () => {
    let code = (0, generators_1.generateJoinCode)();
    while (state_1.state.roomIdsByCode.has(code))
        code = (0, generators_1.generateJoinCode)();
    return code;
};
const deleteRoom = (roomId) => {
    if (!state_1.state.rooms.has(roomId))
        return;
    roomEvents_1.roomEvents.emit('room-deleted', roomId);
    (0, timers_1.cancelTimersByPrefix)(`${roomId}:`);
    state_1.state.deleteRoom(roomId);
    console.log(`Комната ${roomId} удалена`);
};
// Комната без онлайн-участников удаляется через ROOM_EMPTY_TTL_MS
const scheduleEmptyRoomDeletion = (roomId) => (0, timers_1.scheduleTimer)(emptyTimerKey(roomId), env_1.env.roomEmptyTtlMs, () => deleteRoom(roomId));
const cancelEmptyRoomDeletion = (roomId) => (0, timers_1.cancelTimer)(emptyTimerKey(roomId));
const create = ({ isPrivate, password }) => {
    const room = {
        id: (0, generators_1.generateId)(),
        joinCode: generateUniqueJoinCode(),
        createdAt: new Date(),
        hostToken: (0, generators_1.generateSecretToken)(),
        isPrivate,
        password: isPrivate ? password : undefined,
    };
    state_1.state.rooms.set(room.id, room);
    state_1.state.roomIdsByCode.set(room.joinCode, room.id);
    // Пока никто не подключился, комната пустая
    scheduleEmptyRoomDeletion(room.id);
    console.log(`Комната создана: ${room.id} (${isPrivate ? 'приватная' : 'публичная'})`);
    return { id: room.id, joinCode: room.joinCode, hostToken: room.hostToken, isPrivate };
};
const findById = (roomId) => state_1.state.rooms.get(roomId);
const findByCode = (code) => {
    const roomId = state_1.state.roomIdsByCode.get(normalizeJoinCode(code));
    return roomId ? findById(roomId) : undefined;
};
// Новый код; старый перестаёт работать сразу
const regenerateJoinCode = (room) => {
    state_1.state.roomIdsByCode.delete(room.joinCode);
    room.joinCode = generateUniqueJoinCode();
    state_1.state.roomIdsByCode.set(room.joinCode, room.id);
    return room.joinCode;
};
const checkPassword = (room, password) => !room.isPrivate || room.password === password;
const isHostToken = (room, hostToken) => !!hostToken && room.hostToken === hostToken;
exports.roomsService = {
    create,
    findById,
    findByCode,
    regenerateJoinCode,
    checkPassword,
    isHostToken,
    scheduleEmptyRoomDeletion,
    cancelEmptyRoomDeletion,
};
