"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoomIdParam = void 0;
const validators_1 = require("./validators");
// roomId из пути; null, если это не UUID в нижнем регистре
const getRoomIdParam = (req) => {
    const raw = req.params.roomId;
    const value = Array.isArray(raw) ? raw[0] : raw;
    return (0, validators_1.isRoomId)(value) ? value : null;
};
exports.getRoomIdParam = getRoomIdParam;
