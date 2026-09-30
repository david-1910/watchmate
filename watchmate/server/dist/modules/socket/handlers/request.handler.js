"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRequestHandlers = void 0;
const host_service_1 = require("../../members/host.service");
const requests_service_1 = require("../../playback/requests.service");
const socket_guards_1 = require("../socket.guards");
const socketEvents_1 = require("../../../shared/constants/socketEvents");
const validators_1 = require("../../../shared/utils/validators");
const REQUEST_TYPES = ['pause', 'play', 'change-video'];
const isRequestType = (value) => REQUEST_TYPES.some((type) => type === value);
const parsePlaybackRequest = (raw) => {
    if (!(0, validators_1.isObject)(raw) || !isRequestType(raw.type))
        return null;
    if (raw.videoUrl === undefined)
        return { type: raw.type };
    return typeof raw.videoUrl === 'string' ? { type: raw.type, videoUrl: raw.videoUrl } : null;
};
const parseRequestAnswer = (raw) => (0, validators_1.isObject)(raw) && typeof raw.requestId === 'string' && typeof raw.accepted === 'boolean'
    ? { requestId: raw.requestId, accepted: raw.accepted }
    : null;
// Запрос не-хоста уходит только сокетам хоста
const handlePlaybackRequest = (io, socket, request) => {
    const member = (0, socket_guards_1.getSocketMember)(socket);
    const hostId = host_service_1.hostService.getHostId(socket.data.roomId);
    if (!member || !hostId || (0, socket_guards_1.isHost)(socket))
        return;
    io.to(hostId).emit(socketEvents_1.SOCKET_EVENTS.PLAYBACK_REQUEST_NOTIFY, {
        id: requests_service_1.requestsService.create(socket.data.roomId, member.userId, request.type),
        fromUserId: member.userId,
        fromUserName: member.userName,
        ...request,
    });
};
// Ответ хоста приходит отправителю запроса в его личный канал
const handleRequestAnswer = (io, socket, { requestId, accepted }) => {
    if (!(0, socket_guards_1.isHost)(socket))
        return;
    const request = requests_service_1.requestsService.answer(socket.data.roomId, requestId);
    if (!request)
        return;
    io.to(request.fromUserId).emit(socketEvents_1.SOCKET_EVENTS.PLAYBACK_REQUEST_ANSWERED, { requestId, type: request.type, accepted });
};
const registerRequestHandlers = (io, socket) => {
    (0, socket_guards_1.onEvent)(socket, socketEvents_1.SOCKET_EVENTS.PLAYBACK_REQUEST, parsePlaybackRequest, (data) => handlePlaybackRequest(io, socket, data));
    (0, socket_guards_1.onEvent)(socket, socketEvents_1.SOCKET_EVENTS.PLAYBACK_REQUEST_ANSWER, parseRequestAnswer, (data) => handleRequestAnswer(io, socket, data));
};
exports.registerRequestHandlers = registerRequestHandlers;
