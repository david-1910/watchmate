"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSocketGateway = void 0;
const socket_io_1 = require("socket.io");
const room_handler_1 = require("./handlers/room.handler");
const chat_handler_1 = require("./handlers/chat.handler");
const video_handler_1 = require("./handlers/video.handler");
const queue_handler_1 = require("./handlers/queue.handler");
const suggestions_handler_1 = require("./handlers/suggestions.handler");
const ready_handler_1 = require("./handlers/ready.handler");
const reactions_handler_1 = require("./handlers/reactions.handler");
const countdown_handler_1 = require("./handlers/countdown.handler");
const playback_handler_1 = require("./handlers/playback.handler");
const request_handler_1 = require("./handlers/request.handler");
const transfer_handler_1 = require("./handlers/transfer.handler");
// Простой rate limiter для socket событий
const socketRateLimiter = (socket, limitPerSecond = 10) => {
    let count = 0;
    let blocked = false;
    const reset = setInterval(() => { count = 0; }, 1000);
    socket.on('disconnect', () => clearInterval(reset));
    return () => {
        count++;
        if (count > limitPerSecond && !blocked) {
            blocked = true;
            console.warn(`Socket flood от ${socket.id} — отключаем`);
            socket.disconnect(true);
        }
    };
};
const createSocketGateway = (httpServer) => {
    const io = new socket_io_1.Server(httpServer, {
        cors: { origin: true, credentials: true, methods: ['GET', 'POST'] },
        // Ограничение размера пакета
        maxHttpBufferSize: 1e5, // 100 KB
        pingTimeout: 30000,
        pingInterval: 25000,
    });
    // Лимит одновременных подключений с одного IP (защита от DDoS ботов)
    const ipConnections = new Map();
    const MAX_CONNECTIONS_PER_IP = 10;
    io.on('connection', (socket) => {
        const ip = socket.handshake.address;
        const current = ipConnections.get(ip) ?? 0;
        if (current >= MAX_CONNECTIONS_PER_IP) {
            console.warn(`Лимит подключений превышен для IP ${ip}`);
            socket.disconnect(true);
            return;
        }
        ipConnections.set(ip, current + 1);
        socket.on('disconnect', () => {
            const n = ipConnections.get(ip) ?? 1;
            if (n <= 1)
                ipConnections.delete(ip);
            else
                ipConnections.set(ip, n - 1);
        });
        const checkRate = socketRateLimiter(socket, 15);
        socket.onAny(() => checkRate());
        console.log('Пользователь подключился:', socket.id);
        (0, room_handler_1.registerRoomHandlers)(io, socket);
        (0, chat_handler_1.registerChatHandlers)(io, socket);
        (0, video_handler_1.registerVideoHandlers)(io, socket);
        (0, queue_handler_1.registerQueueHandlers)(io, socket);
        (0, suggestions_handler_1.registerSuggestionsHandlers)(io, socket);
        (0, ready_handler_1.registerReadyHandlers)(io, socket);
        (0, reactions_handler_1.registerReactionsHandlers)(io, socket);
        (0, countdown_handler_1.registerCountdownHandlers)(io, socket);
        (0, playback_handler_1.registerPlaybackHandlers)(io, socket);
        (0, request_handler_1.registerRequestHandlers)(io, socket);
        (0, transfer_handler_1.registerTransferHandlers)(io, socket);
    });
    return io;
};
exports.createSocketGateway = createSocketGateway;
