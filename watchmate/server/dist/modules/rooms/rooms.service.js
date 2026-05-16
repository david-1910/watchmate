"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomsService = void 0;
const state_1 = require("../state/state");
const generators_1 = require("../../shared/utils/generators");
const create = (params) => {
    const id = (0, generators_1.generateRoomId)();
    const hostToken = (0, generators_1.generateHostToken)();
    const room = {
        id,
        createdAt: new Date(),
        hostToken,
        isPrivate: params.isPrivate,
        password: params.isPrivate ? params.password : undefined,
    };
    state_1.state.rooms.set(id, room);
    console.log(`Комната создана: ${id} (${params.isPrivate ? 'приватная' : 'публичная'})`);
    return { id, hostToken, isPrivate: params.isPrivate };
};
const findById = (id) => state_1.state.rooms.get(id.toUpperCase());
const verifyPassword = (id, password) => {
    const room = findById(id);
    if (!room)
        return false;
    if (!room.isPrivate)
        return true;
    return room.password === password;
};
exports.roomsService = { create, findById, verifyPassword };
