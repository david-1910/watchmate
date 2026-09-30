"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestionsService = void 0;
const state_1 = require("../state/state");
const queue_service_1 = require("../queue/queue.service");
const generators_1 = require("../../shared/utils/generators");
const getSuggestions = (roomId) => state_1.state.roomSuggestions.get(roomId) ?? [];
const suggest = (roomId, { url, title, userName, userId }) => {
    const suggestions = [
        ...getSuggestions(roomId),
        { id: (0, generators_1.generateId)(), url, title: title || url, suggestedBy: userName, suggestedById: userId },
    ];
    state_1.state.roomSuggestions.set(roomId, suggestions);
    return suggestions;
};
const reject = (roomId, suggestionId) => {
    const filtered = getSuggestions(roomId).filter((s) => s.id !== suggestionId);
    state_1.state.roomSuggestions.set(roomId, filtered);
    return filtered;
};
const accept = (roomId, suggestionId) => {
    const suggestion = getSuggestions(roomId).find((s) => s.id === suggestionId);
    if (!suggestion)
        return null;
    const queue = queue_service_1.queueService.add(roomId, suggestion.url, suggestion.title);
    const suggestions = reject(roomId, suggestionId);
    return { suggestions, queue };
};
exports.suggestionsService = { getSuggestions, suggest, accept, reject };
