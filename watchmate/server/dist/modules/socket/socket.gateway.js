"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSocketGateway = void 0;
const socket_io_1 = require("socket.io");
const members_service_1 = require("../members/members.service");
const socket_broadcaster_1 = require("./socket.broadcaster");
const presence_handler_1 = require("./handlers/presence.handler");
const playback_handler_1 = require("./handlers/playback.handler");
const reactions_handler_1 = require("./handlers/reactions.handler");
const request_handler_1 = require("./handlers/request.handler");
const env_1 = require("../../shared/config/env");
const limits_1 = require("../../shared/constants/limits");
const validators_1 = require("../../shared/utils/validators");
const MAX_CONNECTIONS_PER_IP = 10;
const HANDLERS = [
    presence_handler_1.registerPresenceHandlers,
    playback_handler_1.registerPlaybackHandlers,
    reactions_handler_1.registerReactionsHandlers,
    request_handler_1.registerRequestHandlers,
];
// За прокси (TRUST_PROXY=1) берём последний адрес X-Forwarded-For — его добавил наш прокси
const getClientIp = (socket) => {
    const forwarded = socket.handshake.headers['x-forwarded-for'];
    if (!env_1.env.trustProxy || typeof forwarded !== 'string')
        return socket.handshake.address;
    return forwarded.split(',').pop()?.trim() || socket.handshake.address;
};
// auth { roomId, memberToken } → socket.data
const authenticate = (socket, next) => {
    const auth = socket.handshake.auth;
    const roomId = (0, validators_1.isObject)(auth) ? auth.roomId : undefined;
    const memberToken = (0, validators_1.isObject)(auth) ? auth.memberToken : undefined;
    if (!(0, validators_1.isRoomId)(roomId) || typeof memberToken !== 'string')
        return next(new Error('UNAUTHORIZED'));
    const member = members_service_1.membersService.authenticate(roomId, memberToken);
    if (!member)
        return next(new Error('UNAUTHORIZED'));
    socket.data = { roomId, userId: member.userId };
    next();
};
// Лимит одновременных подключений с одного IP. Последний в цепочке io.use:
// счётчик растёт только у сокетов, которые точно подключатся
const createIpConnectionLimiter = () => {
    const ipConnections = new Map();
    return (socket, next) => {
        const ip = getClientIp(socket);
        const current = ipConnections.get(ip) ?? 0;
        if (current >= MAX_CONNECTIONS_PER_IP) {
            console.warn(`Лимит подключений превышен для IP ${ip}`);
            return next(new Error('RATE_LIMIT'));
        }
        ipConnections.set(ip, current + 1);
        socket.on('disconnect', () => {
            const n = ipConnections.get(ip) ?? 1;
            if (n <= 1)
                ipConnections.delete(ip);
            else
                ipConnections.set(ip, n - 1);
        });
        next();
    };
};
// Больше SOCKET_EVENTS_PER_SECOND событий в секунду — лишние отбрасываются, сокет не отключается
const dropFloodEvents = (socket) => {
    let windowStart = Date.now();
    let count = 0;
    socket.use((_packet, next) => {
        const now = Date.now();
        if (now - windowStart >= 1000) {
            windowStart = now;
            count = 0;
        }
        count += 1;
        if (count <= limits_1.SOCKET_EVENTS_PER_SECOND)
            next();
    });
};
const createSocketGateway = (httpServer) => {
    const io = new socket_io_1.Server(httpServer, {
        cors: { origin: true, credentials: true, methods: ['GET', 'POST'] },
        maxHttpBufferSize: 1e5, // 100 KB
        pingTimeout: 30000,
        pingInterval: 25000,
    });
    io.use(authenticate);
    io.use(createIpConnectionLimiter());
    (0, socket_broadcaster_1.subscribeRoomEvents)(io);
    io.on('connection', (socket) => {
        dropFloodEvents(socket);
        HANDLERS.forEach((register) => register(io, socket));
    });
    return io;
};
exports.createSocketGateway = createSocketGateway;
