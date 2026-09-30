"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.snapshotService = void 0;
const members_service_1 = require("../members/members.service");
const host_service_1 = require("../members/host.service");
const ready_service_1 = require("../ready/ready.service");
const playback_service_1 = require("../playback/playback.service");
const queue_service_1 = require("../queue/queue.service");
const suggestions_service_1 = require("../suggestions/suggestions.service");
const chat_service_1 = require("../chat/chat.service");
// Полное состояние комнаты для участника (CONTRACT.md: RoomSnapshot)
const build = (room, userId) => ({
    room: { id: room.id, joinCode: room.joinCode, isPrivate: room.isPrivate, createdAt: room.createdAt.toISOString() },
    me: { userId },
    users: members_service_1.membersService.getUsers(room.id),
    hostId: host_service_1.hostService.getHostId(room.id),
    ready: ready_service_1.readyService.getState(room.id),
    video: playback_service_1.playbackService.getVideo(room.id),
    playback: playback_service_1.playbackService.getPosition(room.id),
    queue: queue_service_1.queueService.getQueue(room.id),
    suggestions: suggestions_service_1.suggestionsService.getSuggestions(room.id),
    lastSeq: chat_service_1.chatService.getLastSeq(room.id),
});
exports.snapshotService = { build };
