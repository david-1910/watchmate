"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestionsService = void 0;
const state_1 = require("../state/state");
const generators_1 = require("../../shared/utils/generators");
const getSuggestions = (roomId) => state_1.state.roomSuggestions.get(roomId) ?? [];
const suggest = (roomId, url, title, userName, userId) => {
    const suggestions = [
        ...getSuggestions(roomId),
        { id: (0, generators_1.generateId)(), url, title: title || url, suggestedBy: userName, suggestedById: userId },
    ];
    state_1.state.roomSuggestions.set(roomId, suggestions);
    return suggestions;
};
const accept = (roomId, suggestionId) => {
    const suggestions = getSuggestions(roomId);
    const suggestion = suggestions.find((s) => s.id === suggestionId);
    if (!suggestion)
        return null;
    const queue = [...(state_1.state.roomQueues.get(roomId) ?? []), {
            id: (0, generators_1.generateId)(),
            url: suggestion.url,
            title: suggestion.title,
        }];
    state_1.state.roomQueues.set(roomId, queue);
    const filtered = suggestions.filter((s) => s.id !== suggestionId);
    state_1.state.roomSuggestions.set(roomId, filtered);
    return { suggestions: filtered, queue };
};
const reject = (roomId, suggestionId) => {
    const filtered = getSuggestions(roomId).filter((s) => s.id !== suggestionId);
    state_1.state.roomSuggestions.set(roomId, filtered);
    return filtered;
};
exports.suggestionsService = { getSuggestions, suggest, accept, reject };
