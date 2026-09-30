"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireHost = exports.requireMember = exports.requireRoom = exports.getMember = exports.getRoom = void 0;
const rooms_service_1 = require("../rooms/rooms.service");
const members_service_1 = require("../members/members.service");
const host_service_1 = require("../members/host.service");
const params_1 = require("../../shared/utils/params");
const response_1 = require("../../shared/utils/response");
// Уровни доступа из CONTRACT.md, раздел 5: public (requireRoom), member, host
const ROOM_NOT_FOUND = 'Комната не найдена';
const loadRoom = (req, res) => {
    const roomId = (0, params_1.getRoomIdParam)(req);
    const room = roomId ? rooms_service_1.roomsService.findById(roomId) : undefined;
    if (!room)
        (0, response_1.sendNotFound)(res, ROOM_NOT_FOUND);
    return room ?? null;
};
const bearerToken = (req) => {
    const header = req.headers.authorization;
    return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
};
const getRoom = (res) => res.locals.room;
exports.getRoom = getRoom;
const getMember = (res) => res.locals.member;
exports.getMember = getMember;
const requireRoom = (req, res, next) => {
    const room = loadRoom(req, res);
    if (!room)
        return;
    res.locals.room = room;
    next();
};
exports.requireRoom = requireRoom;
const requireMember = (req, res, next) => {
    const room = loadRoom(req, res);
    if (!room)
        return;
    const token = bearerToken(req);
    const member = token ? members_service_1.membersService.authenticate(room.id, token) : undefined;
    if (!member) {
        (0, response_1.sendError)(res, 'Нужно войти в комнату заново', 'UNAUTHORIZED', 401);
        return;
    }
    res.locals.room = room;
    res.locals.member = member;
    next();
};
exports.requireMember = requireMember;
const hostOnly = (_req, res, next) => {
    if (!host_service_1.hostService.isHost((0, exports.getRoom)(res).id, (0, exports.getMember)(res).userId)) {
        (0, response_1.sendError)(res, 'Только хост может выполнять это действие', 'FORBIDDEN', 403);
        return;
    }
    next();
};
exports.requireHost = [exports.requireMember, hostOnly];
