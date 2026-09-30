"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestsService = void 0;
const state_1 = require("../state/state");
const generators_1 = require("../../shared/utils/generators");
// Запросы зрителей ждут ответа хоста; при удалении комнаты исчезают вместе с ней
const create = (roomId, fromUserId, type) => {
    const id = (0, generators_1.generateId)();
    const requests = state_1.state.roomRequests.get(roomId) ?? new Map();
    requests.set(id, { fromUserId, type });
    state_1.state.roomRequests.set(roomId, requests);
    return id;
};
// Ответ хоста: запрос закрывается; null — запроса нет (уже отвечен или чужой комнаты)
const answer = (roomId, requestId) => {
    const requests = state_1.state.roomRequests.get(roomId);
    const request = requests?.get(requestId) ?? null;
    if (request)
        requests?.delete(requestId);
    return request;
};
exports.requestsService = { create, answer };
