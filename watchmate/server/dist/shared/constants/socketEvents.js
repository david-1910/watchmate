"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOCKET_EVENTS = void 0;
// Ровно события из CONTRACT.md, раздел 6
exports.SOCKET_EVENTS = {
    // Client → Server
    PLAYBACK_SYNC: 'playback-sync',
    REACTION: 'reaction',
    PLAYBACK_REQUEST: 'playback-request',
    // Server → Client (REACTION тоже рассылается клиентам)
    USERS_UPDATE: 'users-update',
    HOST_UPDATE: 'host-update',
    ROOM_UPDATE: 'room-update',
    MESSAGE_NEW: 'message-new',
    VIDEO_UPDATE: 'video-update',
    PLAYBACK_UPDATE: 'playback-update',
    PLAYBACK_REQUEST_NOTIFY: 'playback-request-notify',
    READY_UPDATE: 'ready-update',
    COUNTDOWN: 'countdown',
    QUEUE_UPDATE: 'queue-update',
    SUGGESTIONS_UPDATE: 'suggestions-update',
    SESSION_ENDED: 'session-ended',
};
