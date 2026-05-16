"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSuggestionsHandlers = void 0;
const state_1 = require("../../state/state");
const socketEvents_1 = require("../../../shared/constants/socketEvents");
const generators_1 = require("../../../shared/utils/generators");
const isHost = (socket, roomId) => state_1.state.roomHosts.get(roomId) === socket.id &&
    state_1.state.userRooms.get(socket.id) === roomId;
const isInRoom = (socket, roomId) => state_1.state.userRooms.get(socket.id) === roomId;
const getSuggestions = (roomId) => state_1.state.roomSuggestions.get(roomId) ?? [];
const handleSuggestVideo = (io, socket, data) => {
    if (!isInRoom(socket, data.roomId) || !data.url?.trim())
        return;
    const userName = state_1.state.userNames.get(socket.id) ?? 'Аноним';
    const suggestions = [
        ...getSuggestions(data.roomId),
        { id: (0, generators_1.generateId)(), url: data.url, title: data.title || data.url, suggestedBy: userName, suggestedById: socket.id },
    ];
    state_1.state.roomSuggestions.set(data.roomId, suggestions);
    io.to(data.roomId).emit(socketEvents_1.SOCKET_EVENTS.SUGGESTIONS_UPDATE, suggestions);
};
const handleAcceptSuggestion = (io, socket, data) => {
    if (!isHost(socket, data.roomId))
        return;
    const suggestions = getSuggestions(data.roomId);
    const suggestion = suggestions.find((s) => s.id === data.suggestionId);
    if (!suggestion)
        return;
    const queue = [...(state_1.state.roomQueues.get(data.roomId) ?? []), {
            id: (0, generators_1.generateId)(),
            url: suggestion.url,
            title: suggestion.title,
        }];
    state_1.state.roomQueues.set(data.roomId, queue);
    const filtered = suggestions.filter((s) => s.id !== data.suggestionId);
    state_1.state.roomSuggestions.set(data.roomId, filtered);
    io.to(data.roomId).emit(socketEvents_1.SOCKET_EVENTS.QUEUE_UPDATE, queue);
    io.to(data.roomId).emit(socketEvents_1.SOCKET_EVENTS.SUGGESTIONS_UPDATE, filtered);
};
const handleRejectSuggestion = (io, socket, data) => {
    if (!isHost(socket, data.roomId))
        return;
    const filtered = getSuggestions(data.roomId).filter((s) => s.id !== data.suggestionId);
    state_1.state.roomSuggestions.set(data.roomId, filtered);
    io.to(data.roomId).emit(socketEvents_1.SOCKET_EVENTS.SUGGESTIONS_UPDATE, filtered);
};
const registerSuggestionsHandlers = (io, socket) => {
    socket.on(socketEvents_1.SOCKET_EVENTS.SUGGEST_VIDEO, (data) => handleSuggestVideo(io, socket, data));
    socket.on(socketEvents_1.SOCKET_EVENTS.ACCEPT_SUGGESTION, (data) => handleAcceptSuggestion(io, socket, data));
    socket.on(socketEvents_1.SOCKET_EVENTS.REJECT_SUGGESTION, (data) => handleRejectSuggestion(io, socket, data));
};
exports.registerSuggestionsHandlers = registerSuggestionsHandlers;
